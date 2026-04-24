/**
 * Utility functions for currency formatting, date manipulation, and HTML escaping
 */

/**
 * Format a number as EUR currency (Dutch-Belgian locale)
 * @param {number} n - Number to format
 * @returns {string} Formatted currency string (e.g., "€ 100,00")
 */
export const currency = (n) => new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(Number(n)||0);

/**
 * Add or subtract days from an ISO date string
 * @param {string} isoDate - Date in ISO format (YYYY-MM-DD)
 * @param {number} days - Number of days to add (negative to subtract)
 * @returns {string} New date in ISO format
 */
export const addDaysISO = (isoDate, days) => { try { const d = new Date(isoDate); d.setDate(d.getDate() + Number(days||0)); return d.toISOString().slice(0,10); } catch { return isoDate; } };

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped HTML string
 */
export const escapeHtml = (str='') => String(str).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
