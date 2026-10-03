import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';

export const MyReservationsPage = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReservations = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await axiosClient.get(`/reservations/user/${user.userId}`);
      setReservations(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [user]);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
    try {
      await axiosClient.patch(`/reservations/${id}/cancel?userId=${user.userId}`);
      fetchReservations();
    } catch (err) {
      alert(err.message || 'Cancellation failed');
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1rem' }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>My Reservations</h2>
      
      {loading && <p>Loading reservations...</p>}
      {error && <p style={{ color: '#ef4444' }}>{error}</p>}

      {!loading && reservations.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
          <p style={{ color: '#64748b' }}>You have no active or past parking reservations.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {reservations.map((res) => (
          <div key={res.reservationId} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem', backgroundColor: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.25rem' }}>{res.facilityName} - Slot {res.slotCode}</h4>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                🕒 {new Date(res.startAt).toLocaleString()} → {new Date(res.endAt).toLocaleString()}
              </p>
              <p style={{ color: '#0f172a', fontWeight: '500', marginTop: '0.25rem' }}>
                Total: ₹{res.totalAmount}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{
                display: 'inline-block',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                backgroundColor: res.status === 'CONFIRMED' ? '#dcfce7' : res.status === 'CANCELLED' ? '#fee2e2' : '#fef3c7',
                color: res.status === 'CONFIRMED' ? '#15803d' : res.status === 'CANCELLED' ? '#b91c1c' : '#b45309'
              }}>
                {res.status}
              </span>
              {(res.status === 'HELD' || res.status === 'CONFIRMED') && (
                <div>
                  <button
                    onClick={() => handleCancel(res.reservationId)}
                    style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    Cancel Booking
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
