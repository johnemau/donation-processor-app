import { COLUMNS } from './constants';

export function sortAndFilterDonations(donations, sortConfig, filters) {
  const filtered = donations.filter(donation =>
    COLUMNS.every(([key]) => {
      const filterVal = (filters[key] || '').toLowerCase().trim();
      if (!filterVal) return true;
      const raw = donation[key];
      let cellVal;
      if (key === 'amount') cellVal = (raw / 100).toFixed(2);
      else if (key === 'createdAt') cellVal = new Date(raw).toLocaleString().toLowerCase();
      else cellVal = String(raw ?? '').toLowerCase();
      return cellVal.includes(filterVal);
    })
  );
  if (!sortConfig.key) return filtered;
  return [...filtered].sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });
}
