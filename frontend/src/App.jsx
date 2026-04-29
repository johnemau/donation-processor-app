import React, { useState, useEffect, useCallback, useMemo } from 'react';

const API_BASE = '/donations';

const STATUS_TRANSITIONS = {
  new: ['pending'],
  pending: ['success', 'failure'],
  success: [],
  failure: [],
};

const STATUS_COLORS = {
  new: { background: '#dbeafe', color: '#1e40af' },
  pending: { background: '#fef9c3', color: '#854d0e' },
  success: { background: '#dcfce7', color: '#166534' },
  failure: { background: '#fee2e2', color: '#991b1b' },
};

const formatAmount = (cents) => {
  return `$${(cents / 100).toFixed(2)}`;
};

const formatDate = (isoString) => {
  return new Date(isoString).toLocaleString();
};

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

export default function App() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionErrors, setActionErrors] = useState({});
  const [updating, setUpdating] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState({});

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSort = (key) => {
    setSortConfig(prev =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  };

  const COLUMNS = [
    ['uuid', 'UUID'],
    ['amount', 'Amount'],
    ['paymentMethod', 'Payment Method'],
    ['nonprofitId', 'Nonprofit'],
    ['donorId', 'Donor'],
    ['status', 'Status'],
    ['createdAt', 'Created At'],
  ];

  const sortedDonations = useMemo(() => {
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
  }, [donations, sortConfig, filters]);

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error(`Failed to fetch donations: ${res.status}`);
      const data = await res.json();
      setDonations(data.donations);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  const updateStatus = async (uuid, newStatus) => {
    setUpdating(prev => ({ ...prev, [uuid]: true }));
    setActionErrors(prev => ({ ...prev, [uuid]: null }));
    try {
      const res = await fetch(`${API_BASE}/${uuid}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionErrors(prev => ({ ...prev, [uuid]: data.error || `Error ${res.status}` }));
      } else {
        setDonations(prev => prev.map(d => d.uuid === uuid ? data : d));
      }
    } catch (err) {
      setActionErrors(prev => ({ ...prev, [uuid]: err.message }));
    } finally {
      setUpdating(prev => ({ ...prev, [uuid]: false }));
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>Donation Processor</h1>
        <button
          onClick={fetchDonations}
          style={{ padding: '8px 16px', cursor: 'pointer', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '12px', borderRadius: '4px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading donations...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
              {COLUMNS.map(([key, label]) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  style={{ padding: '10px', border: '1px solid #e5e7eb', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                >
                  {label}
                  {' '}
                  <span style={{ color: sortConfig.key === key ? '#3b82f6' : '#9ca3af', fontSize: '11px' }}>
                    {sortConfig.key === key ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '⇅'}
                  </span>
                </th>
              ))}
              <th style={{ padding: '10px', border: '1px solid #e5e7eb' }}>Actions</th>
            </tr>
            <tr style={{ background: '#f9fafb' }}>
              {COLUMNS.map(([key]) => (
                <th key={key} style={{ padding: '4px 6px', border: '1px solid #e5e7eb', fontWeight: 'normal' }}>
                  {key === 'status' ? (
                    <select
                      value={filters[key] || ''}
                      onChange={e => handleFilterChange(key, e.target.value)}
                      style={{ width: '100%', padding: '3px 4px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '3px' }}
                    >
                      <option value=''>All</option>
                      {Object.keys(STATUS_TRANSITIONS).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type='text'
                      placeholder='Filter...'
                      value={filters[key] || ''}
                      onChange={e => handleFilterChange(key, e.target.value)}
                      style={{ width: '100%', padding: '3px 4px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '3px', boxSizing: 'border-box' }}
                    />
                  )}
                </th>
              ))}
              <th style={{ padding: '4px 6px', border: '1px solid #e5e7eb' }} />
            </tr>
          </thead>
          <tbody>
            {sortedDonations.map(donation => {
              const transitions = STATUS_TRANSITIONS[donation.status] || [];
              return (
                <tr key={donation.uuid} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td title={donation.uuid} style={{ padding: '10px', border: '1px solid #e5e7eb', fontFamily: 'monospace', fontSize: '12px' }}>
                    {donation.uuid.substring(0, 8)}...
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #e5e7eb' }}>
                    {formatAmount(donation.amount)}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #e5e7eb', textTransform: 'uppercase' }}>
                    {donation.paymentMethod}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #e5e7eb' }}>
                    {donation.nonprofitId}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #e5e7eb' }}>
                    {donation.donorId}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #e5e7eb' }}>
                    <StatusBadge status={donation.status} />
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #e5e7eb', fontSize: '12px' }}>
                    {formatDate(donation.createdAt)}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #e5e7eb' }}>
                    {actionErrors[donation.uuid] && (
                      <div style={{ color: '#991b1b', fontSize: '12px', marginBottom: '4px' }}>
                        {actionErrors[donation.uuid]}
                      </div>
                    )}
                    {transitions.length === 0 ? (
                      <span style={{ color: '#9ca3af', fontSize: '12px' }}>No actions available</span>
                    ) : (
                      <select
                        defaultValue=""
                        disabled={updating[donation.uuid]}
                        onChange={(e) => {
                          if (e.target.value) {
                            updateStatus(donation.uuid, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid #d1d5db',
                          fontSize: '12px',
                          cursor: updating[donation.uuid] ? 'not-allowed' : 'pointer',
                          opacity: updating[donation.uuid] ? 0.6 : 1,
                        }}
                      >
                        <option value="">Select action...</option>
                        {transitions.map(nextStatus => (
                          <option key={nextStatus} value={nextStatus}>
                            → {nextStatus}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '20px' }}>
        Showing {sortedDonations.length} of {donations.length} donation{donations.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
