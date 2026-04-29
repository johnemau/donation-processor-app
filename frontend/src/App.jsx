import React, { useState, useEffect, useCallback } from 'react';

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
              <th style={{ padding: '10px', border: '1px solid #e5e7eb' }}>UUID</th>
              <th style={{ padding: '10px', border: '1px solid #e5e7eb' }}>Amount</th>
              <th style={{ padding: '10px', border: '1px solid #e5e7eb' }}>Payment Method</th>
              <th style={{ padding: '10px', border: '1px solid #e5e7eb' }}>Nonprofit</th>
              <th style={{ padding: '10px', border: '1px solid #e5e7eb' }}>Donor</th>
              <th style={{ padding: '10px', border: '1px solid #e5e7eb' }}>Status</th>
              <th style={{ padding: '10px', border: '1px solid #e5e7eb' }}>Created At</th>
              <th style={{ padding: '10px', border: '1px solid #e5e7eb' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {donations.map(donation => {
              const transitions = STATUS_TRANSITIONS[donation.status] || [];
              return (
                <tr key={donation.uuid} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '10px', border: '1px solid #e5e7eb', fontFamily: 'monospace', fontSize: '12px' }}>
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
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {transitions.map(nextStatus => (
                          <button
                            key={nextStatus}
                            onClick={() => updateStatus(donation.uuid, nextStatus)}
                            disabled={updating[donation.uuid]}
                            style={{
                              padding: '4px 10px',
                              cursor: updating[donation.uuid] ? 'not-allowed' : 'pointer',
                              background: nextStatus === 'success' ? '#16a34a' : nextStatus === 'failure' ? '#dc2626' : '#2563eb',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              opacity: updating[donation.uuid] ? 0.6 : 1,
                            }}
                          >
                            → {nextStatus}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '20px' }}>
        Total donations: {donations.length}
      </p>
    </div>
  );
}
