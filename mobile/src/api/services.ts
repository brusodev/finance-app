import api from './client';

export const authApi = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
  
  register: async (userData: { username: string; password: string; email?: string; full_name?: string }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
};

export const userApi = {
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },
  updateProfile: async (data: any) => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },
};

export const transactionApi = {
  getTransactions: async (skip = 0, limit = 100) => {
    const response = await api.get(`/transactions/?skip=${skip}&limit=${limit}`);
    return response.data;
  },
  getTransaction: async (id: number) => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },
  createTransaction: async (data: any) => {
    const response = await api.post('/transactions/', data);
    return response.data;
  },
  updateTransaction: async (id: number, data: any) => {
    const response = await api.put(`/transactions/${id}`, data);
    return response.data;
  },
  deleteTransaction: async (id: number) => {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  },
};

export const categoryApi = {
  getCategories: async () => {
    const response = await api.get('/categories/');
    return response.data;
  },
  getCategory: async (id: number) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },
  createCategory: async (data: { name: string; icon?: string }) => {
    const response = await api.post('/categories/', data);
    return response.data;
  },
  updateCategory: async (id: number, data: any) => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },
  deleteCategory: async (id: number) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
  getIcons: async () => {
    const response = await api.get('/categories/icons');
    return response.data;
  },
};

export const accountApi = {
  getAccounts: async () => {
    const response = await api.get('/accounts/');
    return response.data;
  },
  getAccount: async (id: number) => {
    const response = await api.get(`/accounts/${id}`);
    return response.data;
  },
  createAccount: async (data: { name: string; account_type: string; initial_balance?: number; currency?: string }) => {
    const response = await api.post('/accounts/', data);
    return response.data;
  },
  updateAccount: async (id: number, data: any) => {
    const response = await api.put(`/accounts/${id}`, data);
    return response.data;
  },
  deleteAccount: async (id: number) => {
    const response = await api.delete(`/accounts/${id}`);
    return response.data;
  },
};

export const dashboardApi = {
  getStats: async (startDate?: string, endDate?: string) => {
    let url = '/dashboard/summary';
    const params = [];
    if (startDate) params.push(`start_date=${startDate}`);
    if (endDate) params.push(`end_date=${endDate}`);
    if (params.length > 0) url += '?' + params.join('&');
    const response = await api.get(url);
    return response.data;
  },
};
