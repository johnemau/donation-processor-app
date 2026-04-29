import React, { useState, useEffect, useCallback, useMemo } from 'react';
import StatusBadge from './components/StatusBadge';
import { STATUS_TRANSITIONS, STATUS_COLORS, COLUMNS } from './utils/constants';
import { formatAmount } from './utils/formatAmount';
import { formatDate } from './utils/formatDate';
import { computeSummary } from './utils/computeSummary';
import { sortAndFilterDonations } from './utils/sortAndFilterDonations';
import { getDonations, patchDonationStatus } from './utils/donationsApi';

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

  const summary = useMemo(() => computeSummary(donations), [donations]);

  const sortedDonations = useMemo(
    () => sortAndFilterDonations(donations, sortConfig, filters),
    [donations, sortConfig, filters]
  );

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDonations();
      setDonations(data);
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
      const updated = await patchDonationStatus(uuid, newStatus);
      setDonations(prev => prev.map(d => d.uuid === uuid ? updated : d));
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

      {!loading && (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <div style={{ flex: '1 1 320px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Donated by Payment Method</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '4px 8px', color: '#6b7280', fontWeight: '600' }}>Method</th>
                  <th style={{ textAlign: 'right', padding: '4px 8px', color: '#6b7280', fontWeight: '600' }}>Donations</th>
                  <th style={{ textAlign: 'right', padding: '4px 8px', color: '#6b7280', fontWeight: '600' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(summary.byMethod).sort(([a], [b]) => a.localeCompare(b)).map(([method, { count, total }]) => (
                  <tr key={method} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 8px', textTransform: 'uppercase', fontWeight: '500' }}>{method}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: '#6b7280' }}>{count}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: '600', color: '#166534' }}>{formatAmount(total)}</td>
                  </tr>
                ))}
                {Object.keys(summary.byMethod).length === 0 && (
                  <tr><td colSpan={3} style={{ padding: '8px', color: '#9ca3af', textAlign: 'center' }}>No data</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ flex: '0 1 260px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Success / Failure Rate</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ ...STATUS_COLORS.success, padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Success</span>
                <span style={{ fontWeight: '700', fontSize: '18px', color: '#166534' }}>
                  {summary.successCount}
                  <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '400', marginLeft: '4px' }}>
                    ({summary.terminalCount > 0 ? ((summary.successCount / summary.terminalCount) * 100).toFixed(1) : '—'}%)
                  </span>
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ ...STATUS_COLORS.failure, padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Failure</span>
                <span style={{ fontWeight: '700', fontSize: '18px', color: '#991b1b' }}>
                  {summary.failureCount}
                  <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '400', marginLeft: '4px' }}>
                    ({summary.terminalCount > 0 ? ((summary.failureCount / summary.terminalCount) * 100).toFixed(1) : '—'}%)
                  </span>
                </span>
              </div>
              {summary.terminalCount > 0 && (
                <div style={{ marginTop: '4px', height: '8px', borderRadius: '4px', background: '#fee2e2', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(summary.successCount / summary.terminalCount) * 100}%`, background: '#22c55e', borderRadius: '4px' }} />
                </div>
              )}
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                Based on {summary.terminalCount} resolved of {summary.total} total
              </div>
            </div>
          </div>
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
