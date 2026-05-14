/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Paleta dark true-black
        dark: {
          bg:      '#000000', // fundo raiz
          surface: '#111111', // cards / painéis
          elevated:'#1a1a1a', // elementos elevados (modais, dropdowns)
          border:  '#222222', // bordas padrão
          muted:   '#2a2a2a', // inputs, backgrounds secundários
        },
      },
    },
  },
  plugins: [],
}
