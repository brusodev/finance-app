/**
 * Formata um número como moeda baseada na preferência
 * @param {number} value - Valor a ser formatado
 * @param {string} currency - Código da moeda (BRL, USD, EUR)
 * @returns {string} Valor formatado com símbolo
 */
export const formatCurrency = (value, currency = 'BRL') => {
  if (value === null || value === undefined || isNaN(value)) {
    value = 0;
  }

  const locale = currency === 'USD' ? 'en-US' : currency === 'EUR' ? 'de-DE' : 'pt-BR';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

/**
 * Retorna o símbolo da moeda
 * @param {string} currency - Código da moeda
 * @returns {string} Símbolo
 */
export const getCurrencySymbol = (currency = 'BRL') => {
  const symbols = {
    'BRL': 'R$',
    'USD': '$',
    'EUR': '€'
  };
  return symbols[currency] || 'R$';
};

/**
 * Formata uma data no padrão brasileiro
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} Data formatada (ex: "10/12/2025")
 */
export const formatDate = (date) => {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR');
};

/**
 * Formata data e hora no padrão brasileiro
 * @param {string|Date} datetime - Data/hora a ser formatada
 * @returns {string} Data/hora formatada (ex: "10/12/2025 15:30")
 */
export const formatDateTime = (datetime) => {
  if (!datetime) return '';

  const dateObj = typeof datetime === 'string' ? new Date(datetime) : datetime;
  return dateObj.toLocaleString('pt-BR');
};
