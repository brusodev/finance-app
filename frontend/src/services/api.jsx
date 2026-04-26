const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const getHeaders = () => ({
  "Content-Type": "application/json",
});

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw {
      status: response.status,
      detail: error.detail || error.message || "Erro na requisição",
    };
  }
  return response.json();
};

// Auth API
export const authAPI = {
  login: async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: getHeaders(), credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  register: async (username, password, email, full_name) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: getHeaders(), credentials: "include",
        body: JSON.stringify({ username, password, email, full_name }),
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: "POST",
        headers: getHeaders(), credentials: "include",
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Change password error:", error);
      throw error;
    }
  },
};

// Users API
export const usersAPI = {
  getProfile: async () => {
    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        method: "GET",
        headers: getHeaders(), credentials: "include",
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Get profile error:", error);
      throw error;
    }
  },

  updateProfile: async (data) => {
    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        method: "PUT",
        headers: getHeaders(), credentials: "include",
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  },
};

// Accounts API
export const accountsAPI = {
  getAll: async () => {
    try {
      const response = await fetch(`${API_URL}/accounts/`, {
        method: "GET",
        headers: getHeaders(), credentials: "include",
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Get accounts error:", error);
      throw error;
    }
  },

  getSuggestions: async () => {
    try {
      const response = await fetch(`${API_URL}/accounts/suggestions`, {
        method: "GET",
        headers: getHeaders(), credentials: "include",
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Get account suggestions error:", error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await fetch(`${API_URL}/accounts/`, {
        method: "POST",
        headers: getHeaders(), credentials: "include",
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Create account error:", error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await fetch(`${API_URL}/accounts/${id}`, {
        method: "PUT",
        headers: getHeaders(), credentials: "include",
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Update account error:", error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await fetch(`${API_URL}/accounts/${id}`, {
        method: "DELETE",
        headers: getHeaders(), credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete account");
      return null;
    } catch (error) {
      console.error("Delete account error:", error);
      throw error;
    }
  },
};

// Categories API
export const categoriesAPI = {
  getAll: async () => {
    try {
      const response = await fetch(`${API_URL}/categories/`, {
        method: "GET",
        headers: getHeaders(), credentials: "include",
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Get categories error:", error);
      throw error;
    }
  },

  getSuggestions: async () => {
    try {
      const response = await fetch(`${API_URL}/categories/suggestions`, {
        method: "GET",
        headers: getHeaders(), credentials: "include",
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Get category suggestions error:", error);
      throw error;
    }
  },

  getIcons: async () => {
    try {
      const response = await fetch(`${API_URL}/categories/icons`, {
        method: "GET",
        headers: getHeaders(), credentials: "include",
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Get category icons error:", error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await fetch(`${API_URL}/categories/`, {
        method: "POST",
        headers: getHeaders(), credentials: "include",
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Create category error:", error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await fetch(`${API_URL}/categories/${id}`, {
        method: "PUT",
        headers: getHeaders(), credentials: "include",
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Update category error:", error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await fetch(`${API_URL}/categories/${id}`, {
        method: "DELETE",
        headers: getHeaders(), credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete category");
      return null;
    } catch (error) {
      console.error("Delete category error:", error);
      throw error;
    }
  },
};

// Cache simples para transações (5 minutos)
const transactionsCache = {
  data: null,
  timestamp: null,
  ttl: 5 * 60 * 1000, // 5 minutos
  isValid() {
    return this.data && this.timestamp && (Date.now() - this.timestamp < this.ttl);
  },
  get() {
    return this.isValid() ? this.data : null;
  },
  set(data) {
    this.data = data;
    this.timestamp = Date.now();
  },
  clear() {
    this.data = null;
    this.timestamp = null;
  }
};

// Transactions API
export const transactionsAPI = {
  getAll: async (useCache = true, limit = 1000) => {
    try {
      // Verificar cache
      if (useCache) {
        const cached = transactionsCache.get();
        if (cached) {
          console.log('✅ Usando transações do cache');
          return cached;
        }
      }

      const response = await fetch(`${API_URL}/transactions/?limit=${limit}`, {
        method: "GET",
        headers: getHeaders(), credentials: "include",
      });
      const data = await handleResponse(response);

      // Salvar no cache
      transactionsCache.set(data);
      return data;
    } catch (error) {
      console.error("Get transactions error:", error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await fetch(`${API_URL}/transactions/`, {
        method: "POST",
        headers: getHeaders(), credentials: "include",
        body: JSON.stringify(data),
      });
      const result = await handleResponse(response);
      // Limpar cache após criar
      transactionsCache.clear();
      return result;
    } catch (error) {
      console.error("Create transaction error:", error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await fetch(`${API_URL}/transactions/${id}`, {
        method: "PUT",
        headers: getHeaders(), credentials: "include",
        body: JSON.stringify(data),
      });
      const result = await handleResponse(response);
      // Limpar cache após atualizar
      transactionsCache.clear();
      return result;
    } catch (error) {
      console.error("Update transaction error:", error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await fetch(`${API_URL}/transactions/${id}`, {
        method: "DELETE",
        headers: getHeaders(), credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete transaction");
      // Limpar cache após deletar
      transactionsCache.clear();
      return null;
    } catch (error) {
      console.error("Delete transaction error:", error);
      throw error;
    }
  },

  getDescriptionSuggestions: async (transactionType = null, categoryId = null, limit = 10) => {
    try {
      const params = new URLSearchParams();
      if (transactionType) params.append('transaction_type', transactionType);
      if (categoryId) params.append('category_id', categoryId);
      if (limit) params.append('limit', limit);

      const response = await fetch(`${API_URL}/transactions/suggestions/descriptions?${params}`, {
        method: "GET",
        headers: getHeaders(), credentials: "include",
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Get description suggestions error:", error);
      throw error;
    }
  },
};

// Transfers API
export const transfersAPI = {
  create: async (data) => {
    try {
      const response = await fetch(`${API_URL}/transfers/`, {
        method: "POST",
        headers: getHeaders(), credentials: "include",
        body: JSON.stringify(data),
      });
      const result = await handleResponse(response);
      // Limpar cache de transações após criar transferência
      transactionsCache.clear();
      return result;
    } catch (error) {
      console.error("Create transfer error:", error);
      throw error;
    }
  },

  getTransactions: async (transferId) => {
    try {
      const response = await fetch(`${API_URL}/transfers/${transferId}/transactions`, {
        method: "GET",
        headers: getHeaders(), credentials: "include",
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Get transfer transactions error:", error);
      throw error;
    }
  },

  delete: async (transferId) => {
    try {
      const response = await fetch(`${API_URL}/transfers/${transferId}`, {
        method: "DELETE",
        headers: getHeaders(), credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete transfer");
      // Limpar cache de transações após deletar transferência
      transactionsCache.clear();
      return null;
    } catch (error) {
      console.error("Delete transfer error:", error);
      throw error;
    }
  },
};

// Investments API
export const investmentsAPI = {
  // Assets
  createAsset: async (assetData) => {
    try {
      const response = await fetch(`${API_URL}/investments/assets`, {
        method: "POST",
        headers: getHeaders(), credentials: "include",
        body: JSON.stringify(assetData),
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Create asset error:", error);
      throw error;
    }
  },

  listAssets: async () => {
    try {
      const response = await fetch(`${API_URL}/investments/assets`, {
        method: "GET",
        headers: getHeaders(), credentials: "include",
      });
      return handleResponse(response);
    } catch (error) {
      console.error("List assets error:", error);
      throw error;
    }
  },

  getAsset: async (assetId) => {
    try {
      const response = await fetch(`${API_URL}/investments/assets/${assetId}`, {
        method: "GET",
        headers: getHeaders(), credentials: "include",
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Get asset error:", error);
      throw error;
    }
  },

  updateAsset: async (assetId, assetData) => {
    try {
      const response = await fetch(`${API_URL}/investments/assets/${assetId}`, {
        method: "PUT",
        headers: getHeaders(), credentials: "include",
        body: JSON.stringify(assetData),
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Update asset error:", error);
      throw error;
    }
  },

  deleteAsset: async (assetId) => {
    try {
      const response = await fetch(`${API_URL}/investments/assets/${assetId}`, {
        method: "DELETE",
        headers: getHeaders(), credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete asset");
      return null;
    } catch (error) {
      console.error("Delete asset error:", error);
      throw error;
    }
  },

  // Transactions
  createTransaction: async (transactionData) => {
    try {
      const response = await fetch(`${API_URL}/investments/transactions`, {
        method: "POST",
        headers: getHeaders(), credentials: "include",
        body: JSON.stringify(transactionData),
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Create investment transaction error:", error);
      throw error;
    }
  },

  listTransactions: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.asset_id) params.append('asset_id', filters.asset_id);
      if (filters.from_date) params.append('from_date', filters.from_date);
      if (filters.to_date) params.append('to_date', filters.to_date);
      if (filters.type) params.append('type', filters.type);

      const url = `${API_URL}/investments/transactions${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url, {
        method: "GET",
        headers: getHeaders(), credentials: "include",
      });
      return handleResponse(response);
    } catch (error) {
      console.error("List investment transactions error:", error);
      throw error;
    }
  },

  getTransaction: async (transactionId) => {
    try {
      const response = await fetch(`${API_URL}/investments/transactions/${transactionId}`, {
        method: "GET",
        headers: getHeaders(), credentials: "include",
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Get investment transaction error:", error);
      throw error;
    }
  },

  updateTransaction: async (transactionId, transactionData) => {
    try {
      const response = await fetch(`${API_URL}/investments/transactions/${transactionId}`, {
        method: "PUT",
        headers: getHeaders(), credentials: "include",
        body: JSON.stringify(transactionData),
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Update investment transaction error:", error);
      throw error;
    }
  },

  deleteTransaction: async (transactionId) => {
    try {
      const response = await fetch(`${API_URL}/investments/transactions/${transactionId}`, {
        method: "DELETE",
        headers: getHeaders(), credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete transaction");
      return null;
    } catch (error) {
      console.error("Delete investment transaction error:", error);
      throw error;
    }
  },

  // Summary
  getSummary: async () => {
    try {
      const response = await fetch(`${API_URL}/investments/summary`, {
        method: "GET",
        headers: getHeaders(), credentials: "include",
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Get investment summary error:", error);
      throw error;
    }
  },

  // Goal
  createOrUpdateGoal: async (goalData) => {
    try {
      const response = await fetch(`${API_URL}/investments/goal`, {
        method: "POST",
        headers: getHeaders(), credentials: "include",
        body: JSON.stringify(goalData),
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Create/update goal error:", error);
      throw error;
    }
  },

  getGoal: async () => {
    try {
      const response = await fetch(`${API_URL}/investments/goal`, {
        method: "GET",
        headers: getHeaders(), credentials: "include",
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Get goal error:", error);
      throw error;
    }
  },

  getGoalProgress: async () => {
    try {
      const response = await fetch(`${API_URL}/investments/goal/progress`, {
        method: "GET",
        headers: getHeaders(), credentials: "include",
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Get goal progress error:", error);
      throw error;
    }
  },

  // Simulation
  simulate: async (simulationData) => {
    try {
      const response = await fetch(`${API_URL}/investments/simulate`, {
        method: "POST",
        headers: getHeaders(), credentials: "include",
        body: JSON.stringify(simulationData),
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Simulate investment error:", error);
      throw error;
    }
  },
};

// Credit Cards API
export const creditCardsAPI = {
  // ---- Config ----
  getConfig: async (accountId) => {
    const response = await fetch(
      `${API_URL}/credit-cards/${accountId}/config`,
      { headers: getHeaders(), credentials: "include" }
    );
    return handleResponse(response);
  },

  createConfig: async (accountId, data) => {
    const response = await fetch(
      `${API_URL}/credit-cards/${accountId}/config`,
      { method: "POST", headers: getHeaders(), credentials: "include", body: JSON.stringify(data) }
    );
    return handleResponse(response);
  },

  updateConfig: async (accountId, data) => {
    const response = await fetch(
      `${API_URL}/credit-cards/${accountId}/config`,
      { method: "PUT", headers: getHeaders(), credentials: "include", body: JSON.stringify(data) }
    );
    return handleResponse(response);
  },

  // ---- Batches ----
  listBatches: async (accountId) => {
    const response = await fetch(
      `${API_URL}/credit-cards/${accountId}/batches`,
      { headers: getHeaders(), credentials: "include" }
    );
    return handleResponse(response);
  },

  createManualBatch: async (accountId, data) => {
    const response = await fetch(
      `${API_URL}/credit-cards/${accountId}/batches/manual`,
      { method: "POST", headers: getHeaders(), credentials: "include", body: JSON.stringify(data) }
    );
    const result = await handleResponse(response);
    transactionsCache.clear();
    return result;
  },

  uploadBatch: async (accountId, referenceMonth, file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(
      `${API_URL}/credit-cards/${accountId}/batches/upload?reference_month=${referenceMonth}`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    );
    const result = await handleResponse(response);
    transactionsCache.clear();
    return result;
  },

  getBatch: async (accountId, batchId) => {
    const response = await fetch(
      `${API_URL}/credit-cards/${accountId}/batches/${batchId}`,
      { headers: getHeaders(), credentials: "include" }
    );
    return handleResponse(response);
  },

  cancelBatch: async (accountId, batchId) => {
    const response = await fetch(
      `${API_URL}/credit-cards/${accountId}/batches/${batchId}`,
      { method: "DELETE", headers: getHeaders(), credentials: "include" }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw { status: response.status, detail: err.detail || "Erro ao cancelar lote" };
    }
    transactionsCache.clear();
    return null;
  },

  // ---- Items ----
  addItem: async (accountId, batchId, data) => {
    const response = await fetch(
      `${API_URL}/credit-cards/${accountId}/batches/${batchId}/items`,
      { method: "POST", headers: getHeaders(), credentials: "include", body: JSON.stringify(data) }
    );
    return handleResponse(response);
  },

  updateItem: async (accountId, batchId, itemId, data) => {
    const response = await fetch(
      `${API_URL}/credit-cards/${accountId}/batches/${batchId}/items/${itemId}`,
      { method: "PUT", headers: getHeaders(), credentials: "include", body: JSON.stringify(data) }
    );
    return handleResponse(response);
  },

  // ---- Confirm ----
  confirmBatch: async (accountId, batchId) => {
    const response = await fetch(
      `${API_URL}/credit-cards/${accountId}/batches/${batchId}/confirm`,
      { method: "POST", headers: getHeaders(), credentials: "include" }
    );
    const result = await handleResponse(response);
    transactionsCache.clear();
    return result;
  },

  registerPayment: async (accountId, batchId, data) => {
    const response = await fetch(
      `${API_URL}/credit-cards/${accountId}/batches/${batchId}/payments`,
      {
        method: "POST",
        headers: getHeaders(),
        credentials: "include",
        body: JSON.stringify(data),
      }
    );
    const result = await handleResponse(response);
    transactionsCache.clear();
    return result;
  },
};

// Default export for compatibility
export const api = {
  auth: authAPI,
  users: usersAPI,
  accounts: accountsAPI,
  categories: categoriesAPI,
  transactions: transactionsAPI,
  transfers: transfersAPI,
  investments: investmentsAPI,
  creditCards: creditCardsAPI,
};