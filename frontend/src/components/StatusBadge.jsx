import React from 'react';
import { STATUS_COLORS } from '../utils/constants';

const StatusBadge = ({ status }) => (
  <span style={{
    ...STATUS_COLORS[status],
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
  }}>
    {status}
  </span>
);

export default StatusBadge;
