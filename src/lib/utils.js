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

const getDocTotal = (d) => {
  if (typeof d?.total === 'number' && !Number.isNaN(d.total)) return d.total;
  const t = d?.totals;
  if (t && typeof t.incTotal === 'number') return t.incTotal;
  return 0;
};

const getDocEx = (d) => {
  const t = d?.totals;
  if (t && typeof t.exTotal === 'number') return t.exTotal;
  return 0;
};

const getDocBtw = (d) => {
  const t = d?.totals;
  if (t && typeof t.btwTotal === 'number') return t.btwTotal;
  return 0;
};

/** Monthly revenue for last N months (ascending) */
export const getMonthlyRevenue = (archive, months = 6) => {
  const invoices = (archive || []).filter(d => d.type === 'FACTUUR');
  const now = new Date();
  return Array.from({ length: months }, (_, i) => {
    const dt = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const ym = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    const total = invoices
      .filter(d => typeof d.date === 'string' && d.date.startsWith(ym))
      .reduce((s, d) => s + getDocTotal(d), 0);
    return {
      key: ym,
      label: dt.toLocaleString('nl-BE', { month: 'short' }),
      total: Math.round(total * 100) / 100,
      isCurrent: i === months - 1,
    };
  });
};

/** BTW summary for a given quarter (1-4) of a year */
export const getBtwSummary = (archive, year, quarter) => {
  const invoices = (archive || []).filter(d => d.type === 'FACTUUR');
  const months = [1, 2, 3].map(m => {
    const month = (quarter - 1) * 3 + m;
    return `${year}-${String(month).padStart(2, '0')}`;
  });
  const quarterDocs = invoices.filter(d => months.some(ym => typeof d.date === 'string' && d.date.startsWith(ym)));
  const exTotal = quarterDocs.reduce((s, d) => s + getDocEx(d), 0);
  const btwTotal = quarterDocs.reduce((s, d) => s + getDocBtw(d), 0);
  const incTotal = quarterDocs.reduce((s, d) => s + getDocTotal(d), 0);
  return { exTotal: Math.round(exTotal * 100) / 100, btwTotal: Math.round(btwTotal * 100) / 100, incTotal: Math.round(incTotal * 100) / 100, docCount: quarterDocs.length };
};

/** Aging buckets for unpaid invoices */
export const getAgingReport = (archive) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const unpaid = (archive || []).filter(d => d.type === 'FACTUUR' && d.status === 'Verzonden');
  const buckets = { current: [], overdue30: [], overdue60: [], overdue90: [] };
  unpaid.forEach(d => {
    const due = d.due_date || d.dueDate || (d.date ? addDaysISO(d.date, 30) : null);
    if (!due) { buckets.current.push(d); return; }
    const daysOver = Math.floor((today - new Date(due)) / 86400000);
    if (daysOver <= 0) buckets.current.push(d);
    else if (daysOver <= 30) buckets.overdue30.push(d);
    else if (daysOver <= 60) buckets.overdue60.push(d);
    else buckets.overdue90.push(d);
  });
  const sum = (arr) => arr.reduce((s, d) => s + getDocTotal(d), 0);
  return {
    current:   { docs: buckets.current,   total: sum(buckets.current) },
    overdue30: { docs: buckets.overdue30, total: sum(buckets.overdue30) },
    overdue60: { docs: buckets.overdue60, total: sum(buckets.overdue60) },
    overdue90: { docs: buckets.overdue90, total: sum(buckets.overdue90) },
  };
};
