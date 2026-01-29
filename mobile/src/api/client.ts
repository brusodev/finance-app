import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Use seu IP local para testar no dispositivo físico (Ex: 192.168.x.x)
// No seu caso, detectamos o IP: 192.168.0.250
const getBaseUrl = () => {
  if (__DEV__) {
    // Para dispositivo físico, use o IP da sua máquina na rede
    return 'http://192.168.0.250:8000';
  }
  return 'https://seu-backend-producao.com';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000, // 10 segundos de timeout
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response ${response.status} from ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`[API] Error ${error.response.status}: ${error.response.config?.url}`);
      console.error('[API] Error data:', error.response.data);
    } else if (error.request) {
      console.error('[API] Network error - sem resposta do servidor');
    } else {
      console.error('[API] Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
