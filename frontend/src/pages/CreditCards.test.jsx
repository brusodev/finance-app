import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import CreditCards from './CreditCards'
import * as api from '../services/api'
import * as AuthContext from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

vi.mock('../services/api', () => ({
  accountsAPI: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  creditCardsAPI: {
    getConfig: vi.fn(),
    createConfig: vi.fn(),
    updateConfig: vi.fn(),
    listBatches: vi.fn(),
    listInstallments: vi.fn(),
    getStatements: vi.fn(),
    payStatement: vi.fn(),
  },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: vi.fn(),
  }
})

describe('CreditCards Component', () => {
  const navigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    AuthContext.useAuth.mockReturnValue({
      user: { currency: 'BRL' },
    })

    vi.mocked(api.accountsAPI.getAll).mockResolvedValue([
      {
        id: 1,
        name: 'Nubank Cartão',
        account_type: 'credit_card',
        balance: -1347.36,
        currency: 'BRL',
        is_active: true,
      },
    ])

    vi.mocked(api.creditCardsAPI.getConfig).mockResolvedValue({
      id: 1,
      account_id: 1,
      bank_name: 'Nubank',
      closing_day: 1,
      due_day: 6,
      credit_limit: 8000,
    })

    vi.mocked(api.creditCardsAPI.listInstallments).mockResolvedValue({ items: [], count: 0, total_remaining: 0 })
    vi.mocked(api.creditCardsAPI.getStatements).mockResolvedValue({
      account_id: 1,
      configured: true,
      current_month: '2026-12-01',
      months: [
        {
          reference_month: '2026-11-01', phase: 'past', status: 'overdue',
          period_start: '2026-10-02', closing_date: '2026-11-01', due_date: '2026-11-06',
          statement: { id: 7, total_amount: 1347.36, paid_amount: 0, outstanding: 1347.36, status: 'overdue', payments: [] },
          pending_batch_ids: [], projected_installments: [], projected_total: 0,
        },
        {
          reference_month: '2026-12-01', phase: 'current', status: 'open_cycle',
          period_start: '2026-11-02', closing_date: '2026-12-01', due_date: '2026-12-06',
          statement: null, pending_batch_ids: [], projected_installments: [], projected_total: 73.32,
        },
      ],
    })

    vi.mocked(useNavigate).mockReturnValue(navigate)
  })

  it('should open the payment modal from the cards page', async () => {
    render(<CreditCards />)

    const payButton = await screen.findByRole('button', { name: /^Pagar fatura$/i })
    fireEvent.click(payButton)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Pagar fatura/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Confirmar pagamento/i })).toBeInTheDocument()
      expect(screen.getByText('Cartão')).toBeInTheDocument()
    })

    expect(navigate).not.toHaveBeenCalled()
  })

  it('shows the statement to pay and the current cycle', async () => {
    render(<CreditCards />)

    expect(await screen.findByText(/Fatura Nov\/2026/)).toBeInTheDocument()
    expect(screen.getByText('Vencida')).toBeInTheDocument()
    expect(screen.getByText(/Ciclo atual: fatura Dez\/2026 \(vence 06\/12\)/)).toBeInTheDocument()
  })

  it('opens the statements page from the Faturas button', async () => {
    render(<CreditCards />)

    fireEvent.click(await screen.findByRole('button', { name: /Faturas/ }))
    expect(navigate).toHaveBeenCalledWith('/cartoes/1/faturas')
  })
})