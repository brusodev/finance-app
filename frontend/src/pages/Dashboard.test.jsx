import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard';
import * as api from '../services/api';
import * as AuthContext from '../context/AuthContext';

// Mock the API
vi.mock('../services/api', () => ({
  transactionsAPI: {
    getAll: vi.fn(),
  },
  categoriesAPI: {
    getAll: vi.fn(),
  },
  accountsAPI: {
    getAll: vi.fn(),
  },
}));

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    AuthContext.useAuth.mockReturnValue({
      user: { username: 'testuser', full_name: 'Test User' }
    });
  });

  it('should render loading state initially', () => {
    api.transactionsAPI.getAll.mockReturnValue(new Promise(() => {}));
    api.categoriesAPI.getAll.mockReturnValue(new Promise(() => {}));
    api.accountsAPI.getAll.mockReturnValue(new Promise(() => {}));

    render(<Dashboard />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should display user name in header', async () => {
    api.transactionsAPI.getAll.mockResolvedValue([]);
    api.categoriesAPI.getAll.mockResolvedValue([]);
    api.accountsAPI.getAll.mockResolvedValue([]);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Bem-vindo, Test User/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should display error message when API fails', async () => {
    api.transactionsAPI.getAll.mockRejectedValue({ detail: 'API Error' });
    api.categoriesAPI.getAll.mockResolvedValue([]);
    api.accountsAPI.getAll.mockResolvedValue([]);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/API Error/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('✅ should calculate totals correctly with transactions', async () => {
    const mockTransactions = [
      { id: 1, amount: 100, description: 'Income', date: '2025-12-01', category: { name: 'Salary', icon: '💰' } },
      { id: 2, amount: -50, description: 'Expense', date: '2025-12-02', category: { name: 'Food', icon: '🍔' } },
    ];

    const mockAccounts = [
      { id: 1, name: 'Checking', balance: 1000 },
      { id: 2, name: 'Savings', balance: 5000 },
    ];

    api.transactionsAPI.getAll.mockResolvedValue(mockTransactions);
    api.categoriesAPI.getAll.mockResolvedValue([]);
    api.accountsAPI.getAll.mockResolvedValue(mockAccounts);

    render(<Dashboard />);

    await waitFor(() => {
      // Check for formatted values - more flexible regex
      const elements = screen.getAllByText(/100,00/);
      expect(elements.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    // Check expense is displayed
    const expenseElements = screen.getAllByText(/50,00/);
    expect(expenseElements.length).toBeGreaterThan(0);

    // Check balance calculation exists
    const balanceElements = screen.getAllByText(/6\.050,00/);
    expect(balanceElements.length).toBeGreaterThan(0);
  });

  it('✅ BUG CHECK: should handle zero balance accounts correctly', async () => {
    const mockAccounts = [
      { id: 1, name: 'Account 1', balance: 0 },
      { id: 2, name: 'Account 2', balance: 0 },
    ];

    api.transactionsAPI.getAll.mockResolvedValue([]);
    api.categoriesAPI.getAll.mockResolvedValue([]);
    api.accountsAPI.getAll.mockResolvedValue(mockAccounts);

    render(<Dashboard />);

    await waitFor(() => {
      // Should display 0,00 for zero balance
      expect(screen.getByText(/0,00/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('✅ BUG CHECK: should display transactions with correct formatting', async () => {
    const mockTransactions = [
      {
        id: 1,
        amount: -117.5,
        description: 'Mac',
        date: '2025-11-29',
        category: { name: 'Refeição', icon: '🍔' }
      }
    ];

    api.transactionsAPI.getAll.mockResolvedValue(mockTransactions);
    api.categoriesAPI.getAll.mockResolvedValue([]);
    api.accountsAPI.getAll.mockResolvedValue([]);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Mac')).toBeInTheDocument();
      expect(screen.getByText('Refeição')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Check formatted currency value exists
    const formattedValue = screen.getAllByText(/117,50/);
    expect(formattedValue.length).toBeGreaterThan(0);
  });

  it('should show message when no transactions', async () => {
    api.transactionsAPI.getAll.mockResolvedValue([]);
    api.categoriesAPI.getAll.mockResolvedValue([]);
    api.accountsAPI.getAll.mockResolvedValue([]);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Nenhuma transação registrada/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should handle transactions without category', async () => {
    const mockTransactions = [
      {
        id: 1,
        amount: 100,
        description: 'Test',
        date: '2025-12-01',
        category: null
      }
    ];

    api.transactionsAPI.getAll.mockResolvedValue(mockTransactions);
    api.categoriesAPI.getAll.mockResolvedValue([]);
    api.accountsAPI.getAll.mockResolvedValue([]);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Sem categoria')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('✅ should limit displayed transactions to 10', async () => {
    const mockTransactions = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      amount: 100,
      description: `Transaction ${i + 1}`,
      date: '2025-12-01',
      category: { name: 'Test', icon: '📝' }
    }));

    api.transactionsAPI.getAll.mockResolvedValue(mockTransactions);
    api.categoriesAPI.getAll.mockResolvedValue([]);
    api.accountsAPI.getAll.mockResolvedValue([]);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Transaction 1')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Check that transaction 10 exists
    expect(screen.getByText('Transaction 10')).toBeInTheDocument();

    // Check that transaction 11 does NOT exist (limit is 10)
    expect(screen.queryByText('Transaction 11')).not.toBeInTheDocument();
  });
});
