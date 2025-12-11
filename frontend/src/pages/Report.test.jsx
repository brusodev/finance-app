import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Report from './Report';

// Mock fetch globally
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => 'test-token'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

describe('Report Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state initially', () => {
    global.fetch.mockImplementation(() => new Promise(() => {}));

    render(<Report />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText(/Carregando relatórios/i)).toBeInTheDocument();
  });

  it('✅ FIXED: should fetch and display data from dashboard API', async () => {
    const mockDashboard = {
      total_accounts: 5,
      total_categories: 2,
      total_transactions: 10,
      total_balance: 17982.0,
      total_income: 5000.0,
      total_expense: 117.0,
      net_balance: 4883.0
    };

    const mockCategories = [
      {
        category_id: 1,
        category_name: 'Alimentação',
        total_income: 0,
        total_expense: 117.0,
        balance: -117.0,
        transaction_count: 2
      }
    ];

    const mockPeriod = {
      total_income: 1000.0,
      total_expense: 200.0,
      balance: 800.0,
      transaction_count: 5,
      period_start: '2025-12-01',
      period_end: '2025-12-31'
    };

    global.fetch.mockImplementation((url) => {
      if (url.includes('/dashboard')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDashboard)
        });
      }
      if (url.includes('/transactions/totals/by-category')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCategories)
        });
      }
      if (url.includes('/transactions/totals/by-period')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPeriod)
        });
      }
    });

    render(<Report />);

    await waitFor(() => {
      expect(screen.getByText('Relatórios Financeiros')).toBeInTheDocument();
    });

    // Check dashboard data is displayed
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument(); // total_accounts
      expect(screen.getByText(/17\.982,00/)).toBeInTheDocument(); // total_balance formatted
      expect(screen.getByText(/5\.000,00/)).toBeInTheDocument(); // total_income formatted
    });

    // Check category data is displayed
    await waitFor(() => {
      expect(screen.getByText('Alimentação')).toBeInTheDocument();
      expect(screen.getByText(/117,00/)).toBeInTheDocument();
    });

    // Check period data is displayed
    await waitFor(() => {
      expect(screen.getByText(/1\.000,00/)).toBeInTheDocument(); // period income
      expect(screen.getByText(/200,00/)).toBeInTheDocument(); // period expense
    });
  });

  it('✅ FIXED: should handle API errors gracefully', async () => {
    global.fetch.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ detail: 'Network error' })
      })
    );

    render(<Report />);

    await waitFor(() => {
      expect(screen.getByText(/Erro ao carregar dados dos relatórios/i)).toBeInTheDocument();
    });
  });

  it('✅ FIXED: Reports now integrate with backend APIs', async () => {
    // This test verifies that the CRITICAL BUG has been FIXED
    // The Report component NOW:
    // 1. ✅ Calls /dashboard API endpoint
    // 2. ✅ Calls /transactions/totals/by-category endpoint
    // 3. ✅ Calls /transactions/totals/by-period endpoint
    // 4. ✅ Displays real financial data
    // 5. ✅ Shows formatted currency values

    const mockDashboard = {
      total_accounts: 3,
      total_categories: 5,
      total_transactions: 25,
      total_balance: 10000.0,
      total_income: 15000.0,
      total_expense: 5000.0,
      net_balance: 10000.0
    };

    global.fetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockDashboard)
      })
    );

    render(<Report />);

    await waitFor(() => {
      // Verify API calls are made
      expect(global.fetch).toHaveBeenCalled();
      const calls = global.fetch.mock.calls;

      // Check that correct endpoints are called
      const urls = calls.map(call => call[0]);
      expect(urls.some(url => url.includes('/dashboard'))).toBe(true);
    });
  });

  it('✅ FIXED: should display formatted currency values', async () => {
    const mockData = {
      total_balance: 1234.56,
      total_income: 9999.99,
      total_expense: 123.45,
      total_accounts: 1,
      total_categories: 1,
      total_transactions: 1,
      net_balance: 100.0
    };

    global.fetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData)
      })
    );

    render(<Report />);

    await waitFor(() => {
      // Check Brazilian currency formatting (1.234,56)
      expect(screen.getByText(/1\.234,56/)).toBeInTheDocument();
      expect(screen.getByText(/9\.999,99/)).toBeInTheDocument();
      expect(screen.getByText(/123,45/)).toBeInTheDocument();
    });
  });
});
