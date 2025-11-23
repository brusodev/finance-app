/**
 * API Client para Finance App
 * 
 * Este módulo centraliza todas as chamadas HTTP para o backend
 * Usa axios como HTTP client
 * 
 * Uso:
 * import { authAPI, usersAPI, categoriesAPI, transactionsAPI } from '@/services/api'
 * 
 * const user = await authAPI.register('user123', 'senha123')
 * const transactions = await transactionsAPI.getAll()
 */

import axios from 'axios'

// Configuração base
const API_BASE_URL = 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Interceptor para adicionar tratamento de erros global
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Erro com resposta do servidor
      console.error('API Error:', error.response.status, error.response.data)
    } else if (error.request) {
      // Requisição feita mas sem resposta
      console.error('No response from API:', error.request)
    } else {
      // Erro ao fazer requisição
      console.error('Error:', error.message)
    }
    return Promise.reject(error)
  }
)

/**
 * ==========================================
 * AUTENTICAÇÃO
 * ==========================================
 */

export const authAPI = {
  /**
   * Registra um novo usuário
   * @param {string} username - Nome de usuário
   * @param {string} password - Senha
   * @returns {Promise<Object>} Usuário criado
   */
  register: async (username, password) => {
    try {
      const response = await api.post('/auth/register', {
        username,
        password,
      })
      return response.data
    } catch (error) {
      console.error('Register error:', error)
      throw error
    }
  },

  /**
   * Faz login de um usuário
   * @param {string} username - Nome de usuário
   * @param {string} password - Senha
   * @returns {Promise<Object>} Usuário logado
   */
  login: async (username, password) => {
    try {
      const response = await api.post('/auth/login', {
        username,
        password,
      })
      // Opcionalmente salvar token/user no localStorage
      if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data))
      }
      return response.data
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  },

  /**
   * Faz logout removendo dados do usuário
   */
  logout: () => {
    localStorage.removeItem('user')
  },

  /**
   * Obter usuário logado do localStorage
   * @returns {Object|null} Usuário logado ou null
   */
  getCurrentUser: () => {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },
}

/**
 * ==========================================
 * USUÁRIOS
 * ==========================================
 */

export const usersAPI = {
  /**
   * Lista todos os usuários
   * @returns {Promise<Array>} Array de usuários
   */
  getAll: async () => {
    try {
      const response = await api.get('/users/')
      return response.data
    } catch (error) {
      console.error('Get all users error:', error)
      throw error
    }
  },

  /**
   * Obtém um usuário específico
   * @param {number} id - ID do usuário
   * @returns {Promise<Object>} Dados do usuário
   */
  getById: async (id) => {
    try {
      const response = await api.get(`/users/${id}`)
      return response.data
    } catch (error) {
      console.error(`Get user ${id} error:`, error)
      throw error
    }
  },

  /**
   * Atualiza dados de um usuário
   * @param {number} id - ID do usuário
   * @param {Object} userData - Dados a atualizar {username, password}
   * @returns {Promise<Object>} Usuário atualizado
   */
  update: async (id, userData) => {
    try {
      const response = await api.put(`/users/${id}`, userData)
      return response.data
    } catch (error) {
      console.error(`Update user ${id} error:`, error)
      throw error
    }
  },

  /**
   * Deleta um usuário
   * @param {number} id - ID do usuário
   * @returns {Promise<Object>} Mensagem de confirmação
   */
  delete: async (id) => {
    try {
      const response = await api.delete(`/users/${id}`)
      return response.data
    } catch (error) {
      console.error(`Delete user ${id} error:`, error)
      throw error
    }
  },
}

/**
 * ==========================================
 * CATEGORIAS
 * ==========================================
 */

export const categoriesAPI = {
  /**
   * Lista todas as categorias
   * @returns {Promise<Array>} Array de categorias
   */
  getAll: async () => {
    try {
      const response = await api.get('/categories/')
      return response.data
    } catch (error) {
      console.error('Get all categories error:', error)
      throw error
    }
  },

  /**
   * Cria uma nova categoria
   * @param {Object} categoryData - Dados da categoria {name}
   * @returns {Promise<Object>} Categoria criada
   */
  create: async (categoryData) => {
    try {
      const response = await api.post('/categories/', categoryData)
      return response.data
    } catch (error) {
      console.error('Create category error:', error)
      throw error
    }
  },

  /**
   * Obtém uma categoria específica
   * @param {number} id - ID da categoria
   * @returns {Promise<Object>} Dados da categoria
   */
  getById: async (id) => {
    try {
      const response = await api.get(`/categories/${id}`)
      return response.data
    } catch (error) {
      console.error(`Get category ${id} error:`, error)
      throw error
    }
  },

  /**
   * Atualiza uma categoria
   * @param {number} id - ID da categoria
   * @param {Object} categoryData - Dados a atualizar {name}
   * @returns {Promise<Object>} Categoria atualizada
   */
  update: async (id, categoryData) => {
    try {
      const response = await api.put(`/categories/${id}`, categoryData)
      return response.data
    } catch (error) {
      console.error(`Update category ${id} error:`, error)
      throw error
    }
  },

  /**
   * Deleta uma categoria
   * @param {number} id - ID da categoria
   * @returns {Promise<Object>} Mensagem de confirmação
   */
  delete: async (id) => {
    try {
      const response = await api.delete(`/categories/${id}`)
      return response.data
    } catch (error) {
      console.error(`Delete category ${id} error:`, error)
      throw error
    }
  },
}

/**
 * ==========================================
 * TRANSAÇÕES
 * ==========================================
 */

export const transactionsAPI = {
  /**
   * Lista todas as transações
   * @returns {Promise<Array>} Array de transações
   */
  getAll: async () => {
    try {
      const response = await api.get('/transactions/')
      return response.data
    } catch (error) {
      console.error('Get all transactions error:', error)
      throw error
    }
  },

  /**
   * Cria uma nova transação
   * @param {Object} transactionData - Dados da transação {amount, date, description, category_id}
   * @returns {Promise<Object>} Transação criada
   */
  create: async (transactionData) => {
    try {
      const response = await api.post('/transactions/', transactionData)
      return response.data
    } catch (error) {
      console.error('Create transaction error:', error)
      throw error
    }
  },

  /**
   * Obtém uma transação específica
   * @param {number} id - ID da transação
   * @returns {Promise<Object>} Dados da transação
   */
  getById: async (id) => {
    try {
      const response = await api.get(`/transactions/${id}`)
      return response.data
    } catch (error) {
      console.error(`Get transaction ${id} error:`, error)
      throw error
    }
  },

  /**
   * Atualiza uma transação
   * @param {number} id - ID da transação
   * @param {Object} transactionData - Dados a atualizar {amount, date, description, category_id}
   * @returns {Promise<Object>} Transação atualizada
   */
  update: async (id, transactionData) => {
    try {
      const response = await api.put(`/transactions/${id}`, transactionData)
      return response.data
    } catch (error) {
      console.error(`Update transaction ${id} error:`, error)
      throw error
    }
  },

  /**
   * Deleta uma transação
   * @param {number} id - ID da transação
   * @returns {Promise<Object>} Mensagem de confirmação
   */
  delete: async (id) => {
    try {
      const response = await api.delete(`/transactions/${id}`)
      return response.data
    } catch (error) {
      console.error(`Delete transaction ${id} error:`, error)
      throw error
    }
  },
}

/**
 * ==========================================
 * HEALTH CHECK
 * ==========================================
 */

export const healthAPI = {
  /**
   * Verifica o status da API
   * @returns {Promise<Object>} Status da API
   */
  check: async () => {
    try {
      const response = await api.get('/')
      return response.data
    } catch (error) {
      console.error('Health check error:', error)
      throw error
    }
  },
}

/**
 * ==========================================
 * EXPORTS
 * ==========================================
 */

export default api

/**
 * Exemplo de uso:
 * 
 * // Importar
 * import { authAPI, transactionsAPI, categoriesAPI } from '@/services/api'
 * 
 * // Login
 * try {
 *   const user = await authAPI.login('user@email.com', 'senha123')
 *   console.log('Usuário logado:', user)
 * } catch (error) {
 *   console.error('Erro ao fazer login:', error)
 * }
 * 
 * // Buscar transações
 * const transactions = await transactionsAPI.getAll()
 * console.log('Transações:', transactions)
 * 
 * // Criar transação
 * const newTransaction = await transactionsAPI.create({
 *   amount: 50.00,
 *   date: '2025-11-23',
 *   description: 'Almoço',
 *   category_id: 1
 * })
 */
