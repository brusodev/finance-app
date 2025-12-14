const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
console.log('🌐 API URL configurada:', API_URL);

const getHeaders = (includeAuth = true) => {
  const headers = {
    "Content-Type": "application/json",
  };
  if (includeAuth) {
    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
};

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
        headers: getHeaders(false),
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
        headers: getHeaders(false),
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
        headers: getHeaders(true),
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
        headers: getHeaders(true),
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
        headers: getHeaders(true),
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
        headers: getHeaders(true),
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
        headers: getHeaders(true),
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
        headers: getHeaders(true),
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
        headers: getHeaders(true),
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
        headers: getHeaders(true),
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
        headers: getHeaders(true),
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
        headers: getHeaders(true),
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Get category suggestions error:", error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await fetch(`${API_URL}/categories/`, {
        method: "POST",
        headers: getHeaders(true),
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
        headers: getHeaders(true),
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
        headers: getHeaders(true),
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
  getAll: async (useCache = true) => {
    try {
      // Verificar cache
      if (useCache) {
        const cached = transactionsCache.get();
        if (cached) {
          console.log('✅ Usando transações do cache');
          return cached;
        }
      }

      const response = await fetch(`${API_URL}/transactions/?limit=50`, {
        method: "GET",
        headers: getHeaders(true),
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
        headers: getHeaders(true),
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
        headers: getHeaders(true),
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
        headers: getHeaders(true),
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
        headers: getHeaders(true),
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Get description suggestions error:", error);
      throw error;
    }
  },
};

// Default export for compatibility
export const api = {
  auth: authAPI,
  users: usersAPI,
  accounts: accountsAPI,
  categories: categoriesAPI,
  transactions: transactionsAPI,
};