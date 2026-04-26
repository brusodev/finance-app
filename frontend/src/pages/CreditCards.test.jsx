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

    vi.mocked(api.creditCardsAPI.listBatches).mockResolvedValue([
      {
        id: 99,
        status: 'confirmed',
        total_amount: 1347.36,
      },
    ])

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
})