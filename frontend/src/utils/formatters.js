/**
 * Formata um número como moeda brasileira
 * @param {number} value - Valor a ser formatado
 * @returns {string} Valor formatado (ex: "1.000,00")
 */
export const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0,00';
  }

  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
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
