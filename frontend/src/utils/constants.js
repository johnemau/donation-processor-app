export const API_BASE = '/donations';

export const STATUS_TRANSITIONS = {
  new: ['pending'],
  pending: ['success', 'failure'],
  success: [],
  failure: [],
};

export const STATUS_COLORS = {
  new: { background: '#dbeafe', color: '#1e40af' },
  pending: { background: '#fef9c3', color: '#854d0e' },
  success: { background: '#dcfce7', color: '#166534' },
  failure: { background: '#fee2e2', color: '#991b1b' },
};

export const COLUMNS = [
  ['uuid', 'UUID'],
  ['amount', 'Amount'],
  ['paymentMethod', 'Payment Method'],
  ['nonprofitId', 'Nonprofit'],
  ['donorId', 'Donor'],
  ['status', 'Status'],
  ['createdAt', 'Created At'],
];
