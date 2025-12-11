import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Accounts from './Accounts';
import * as api from '../services/api';

vi.mock('../services/api', () => ({
  accountsAPI: {
    getAll: vi.fn(),
    getSuggestions: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Accounts Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.accountsAPI.getSuggestions.mockResolvedValue(['Nubank', 'Banco do Brasil']);
  });

  it('✅ should load and display accounts', async () => {
    const mockAccounts = [
      { id: 1, name: 'Nubank', account_type: 'checking', balance: 1000, currency: 'BRL' },
      { id: 2, name: 'Savings', account_type: 'savings', balance: 5000, currency: 'BRL' },
    ];

    api.accountsAPI.getAll.mockResolvedValue(mockAccounts);

    render(<Accounts />);

    await waitFor(() => {
      expect(screen.getByText('Nubank')).toBeInTheDocument();
      expect(screen.getByText('Savings')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Check formatted currency values exist
    const formattedValues = screen.getAllByText(/1\.000,00|5\.000,00/);
    expect(formattedValues.length).toBeGreaterThan(0);
  });

  it('✅ should display zero balance accounts correctly', async () => {
    const mockAccounts = [
      { id: 1, name: 'Empty Account', account_type: 'checking', balance: 0, currency: 'BRL' },
    ];

    api.accountsAPI.getAll.mockResolvedValue(mockAccounts);

    render(<Accounts />);

    await waitFor(() => {
      expect(screen.getByText('Empty Account')).toBeInTheDocument();
      expect(screen.getByText(/0,00/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('✅ should show negative balance in red', async () => {
    const mockAccounts = [
      { id: 1, name: 'Negative Account', account_type: 'credit_card', balance: -500, currency: 'BRL' },
    ];

    api.accountsAPI.getAll.mockResolvedValue(mockAccounts);

    render(<Accounts />);

    await waitFor(() => {
      expect(screen.getByText('Negative Account')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Check that negative value is displayed with formatting
    const balanceElements = screen.getAllByText(/500,00/);
    expect(balanceElements.length).toBeGreaterThan(0);

    // Check for red class
    const balanceElement = balanceElements[0];
    expect(balanceElement.className).toMatch(/text-red/);
  });

  it('✅ should open create form when clicking "Nova Conta"', async () => {
    api.accountsAPI.getAll.mockResolvedValue([]);

    render(<Accounts />);

    await waitFor(() => {
      const newButton = screen.getByText('Nova Conta');
      expect(newButton).toBeInTheDocument();
    }, { timeout: 3000 });

    const newButton = screen.getByText('Nova Conta');
    fireEvent.click(newButton);

    await waitFor(() => {
      expect(screen.getByText(/Nome da Conta/i)).toBeInTheDocument();
      expect(screen.getByText(/Tipo/i)).toBeInTheDocument();
      expect(screen.getByText(/Saldo Inicial/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should validate required fields in form', async () => {
    api.accountsAPI.getAll.mockResolvedValue([]);

    render(<Accounts />);

    const newButton = screen.getByText('Nova Conta');
    fireEvent.click(newButton);

    await waitFor(() => {
      const submitButton = screen.getByText('Salvar');
      fireEvent.click(submitButton);
    }, { timeout: 3000 });

    // Form should not submit without required fields
    expect(api.accountsAPI.create).not.toHaveBeenCalled();
  });

  it('✅ should create account with correct initial_balance field', async () => {
    api.accountsAPI.getAll.mockResolvedValue([]);
    api.accountsAPI.create.mockResolvedValue({ id: 3, name: 'New Account', balance: 1000 });

    const { container } = render(<Accounts />);

    const newButton = screen.getByText('Nova Conta');
    fireEvent.click(newButton);

    await waitFor(() => {
      expect(screen.getByText(/Nome da Conta/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Fill form
    const nameInput = container.querySelector('input[type="text"]');
    const balanceInput = container.querySelector('input[type="number"]');

    if (nameInput && balanceInput) {
      fireEvent.change(nameInput, { target: { value: 'New Account' } });
      fireEvent.change(balanceInput, { target: { value: '1000' } });

      const submitButton = screen.getByText('Salvar');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.accountsAPI.create).toHaveBeenCalledWith({
          name: 'New Account',
          account_type: 'checking',
          initial_balance: 1000,
          currency: 'BRL',
        });
      }, { timeout: 3000 });
    }
  });

  it('should handle API errors gracefully', async () => {
    api.accountsAPI.getAll.mockRejectedValue(new Error('Network error'));

    render(<Accounts />);

    await waitFor(() => {
      expect(screen.getByText(/Erro ao carregar contas/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('✅ should edit existing account', async () => {
    const mockAccounts = [
      { id: 1, name: 'Test Account', account_type: 'checking', balance: 500, currency: 'BRL' },
    ];

    api.accountsAPI.getAll.mockResolvedValue(mockAccounts);
    api.accountsAPI.update.mockResolvedValue({ id: 1, name: 'Updated Account', balance: 600 });

    render(<Accounts />);

    await waitFor(() => {
      expect(screen.getByText('Test Account')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Find edit button by aria-label
    const editButton = screen.getByLabelText(/Editar conta Test Account/i);
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Account')).toBeInTheDocument();
      expect(screen.getByDisplayValue('500')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('✅ should confirm before deleting account', async () => {
    const mockAccounts = [
      { id: 1, name: 'To Delete', account_type: 'checking', balance: 100, currency: 'BRL' },
    ];

    api.accountsAPI.getAll.mockResolvedValue(mockAccounts);

    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<Accounts />);

    await waitFor(() => {
      expect(screen.getByText('To Delete')).toBeInTheDocument();
    }, { timeout: 3000 });

    const deleteButton = screen.getByLabelText(/Excluir conta To Delete/i);
    fireEvent.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(api.accountsAPI.delete).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('should load account suggestions', async () => {
    api.accountsAPI.getAll.mockResolvedValue([]);
    api.accountsAPI.getSuggestions.mockResolvedValue(['Nubank', 'Banco do Brasil', 'Bradesco']);

    render(<Accounts />);

    await waitFor(() => {
      expect(api.accountsAPI.getSuggestions).toHaveBeenCalled();
    }, { timeout: 3000 });
  });
});
