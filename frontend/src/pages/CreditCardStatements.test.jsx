import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import CreditCardStatements from './CreditCardStatements'
import * as api from '../services/api'
import * as AuthContext from '../context/AuthContext'

vi.mock('../services/api', () => ({
  accountsAPI: { getAll: vi.fn() },
  creditCardsAPI: {
    getStatements: vi.fn(),
    getStatement: vi.fn(),
    listInstallments: vi.fn(),
    getInstallmentSchedule: vi.fn(),
    payStatement: vi.fn(),
  },
}))

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }))

const navigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => navigate, useParams: () => ({ accountId: '28' }) }
})

const month = (reference_month, extra) => ({
  reference_month,
  period_start: null, closing_date: null, due_date: `${reference_month.slice(0, 8)}06`,
  closed: false, statement: null, pending_batch_ids: [],
  projected_installments: [], projected_total: 0,
  ...extra,
})

describe('CreditCardStatements', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    AuthContext.useAuth.mockReturnValue({ user: { currency: 'BRL' } })
    vi.mocked(api.accountsAPI.getAll).mockResolvedValue([
      { id: 28, name: 'Nubank', account_type: 'credit_card', is_active: true },
      { id: 3, name: 'Conta', account_type: 'checking', is_active: true },
    ])
    vi.mocked(api.creditCardsAPI.getStatements).mockResolvedValue({
      account_id: 28,
      configured: true,
      current_month: '2026-12-01',
      months: [
        month('2026-10-01', {
          phase: 'past', status: 'paid',
          statement: {
            id: 7, total_amount: 983.52, paid_amount: 983.52, outstanding: 0, status: 'paid',
            paid_on: '2026-10-08',
            payments: [{ id: 1, date: '2026-10-08', amount: 983.52, from_account_name: 'Conta' }],
          },
        }),
        month('2026-11-01', {
          phase: 'past', status: 'missing', projected_total: 73.32,
          projected_installments: [
            { description: 'O Boticário', number: 4, total: 4, amount: 50.32, end_month: '2026-11-01' },
            { description: 'Lenovo', number: 2, total: 3, amount: 23, end_month: '2026-12-01' },
          ],
        }),
        month('2026-12-01', { phase: 'current', status: 'open_cycle', projected_total: 23 }),
        month('2027-01-01', { phase: 'future', status: 'forecast' }),
      ],
    })
    vi.mocked(api.creditCardsAPI.getStatement).mockResolvedValue({
      items: [{
        id: 1, batch_id: 19, date: '2026-09-05', description: 'Lenovo', amount: 23,
        category_name: 'Eletrônicos', installment_current: 1, installment_total: 3,
        installment_end_month: '2026-12-01', out_of_cycle: false,
      }],
      batches: [{ id: 19, file_name: 'nubank-set.ofx', item_count: 36 }],
    })
    vi.mocked(api.creditCardsAPI.listInstallments).mockResolvedValue({
      count: 1, total_remaining: 46,
      items: [{ description: 'Lenovo', current: 1, total: 3, remaining: 2, per_installment: 23, remaining_amount: 46, end_month: '2026-12-01' }],
    })
    vi.mocked(api.creditCardsAPI.getInstallmentSchedule).mockResolvedValue({
      months: [{ due_month: '2026-11-01', total: 73.32 }, { due_month: '2026-12-01', total: 23 }],
      total: 96.32,
    })
  })

  it('renders the month strip with statuses and opens the current month', async () => {
    render(<CreditCardStatements />)

    const strip = await screen.findByRole('list', { name: 'Faturas por mês' })
    expect(within(strip).getByText('Paga')).toBeInTheDocument()
    expect(within(strip).getByText('Não importada')).toBeInTheDocument()
    expect(within(strip).getByText('Ciclo atual')).toBeInTheDocument()
    expect(within(strip).getByText('Prevista')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Fatura de dezembro de 2026/i })).toBeInTheDocument()
  })

  it('shows projected installments for a month not yet imported', async () => {
    render(<CreditCardStatements />)

    fireEvent.click(await screen.findByRole('button', { name: /Nov\/2026/ }))
    expect(screen.getByText('Parcelas previstas nesta fatura')).toBeInTheDocument()
    expect(screen.getByText('4/4 · última')).toBeInTheDocument()
    expect(screen.getByText('2/3 · até Dez/2026')).toBeInTheDocument()
  })

  it('shows payments and items with purchase date for a paid statement', async () => {
    render(<CreditCardStatements />)

    fireEvent.click(await screen.findByRole('button', { name: /Out\/2026/ }))
    expect(screen.getByText(/Pago em 08\/10\/2026 · Conta/)).toBeInTheDocument()
    expect(await screen.findByText('1/3 · termina Dez/2026')).toBeInTheDocument()
    expect(screen.getByText('05/09/2026')).toBeInTheDocument()
    expect(api.creditCardsAPI.getStatement).toHaveBeenCalledWith('28', 7)
  })
})
