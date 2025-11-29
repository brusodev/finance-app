import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0'  // Permite acesso de qualquer IP na rede
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: ['.railway.app', '.up.railway.app']  // Permite Railway
  }
})
