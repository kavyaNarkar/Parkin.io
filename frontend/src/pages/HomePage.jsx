import React from 'react';
import { Link } from 'react-router-dom';

export const HomePage = () => {
  return (
    <div style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#0f172a' }}>
        Intelligent Parking Slot Finder & Reservation System
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#475569', marginBottom: '2rem' }}>
        Locate real-time available parking facilities, choose preferred zones and slots, and reserve your space seamlessly.
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link to="/search" style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '0.8rem 1.5rem', borderRadius: '6px', textDecoration: 'none', fontWeight: '600' }}>
          🔍 Search Nearby Parking
        </Link>
        <Link to="/register" style={{ backgroundColor: '#e2e8f0', color: '#1e293b', padding: '0.8rem 1.5rem', borderRadius: '6px', textDecoration: 'none', fontWeight: '600' }}>
          Create Account
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginTop: '4rem', textAlign: 'left' }}>
        <div style={{ padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#ffffff' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>📍 Real-Time Discovery</h3>
          <p style={{ color: '#64748b' }}>Search facilities by city, area, or location and view exact availability.</p>
        </div>
        <div style={{ padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#ffffff' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>🔒 Guaranteed Slots</h3>
          <p style={{ color: '#64748b' }}>Our locking algorithm prevents double-booking and holds your slot during checkout.</p>
        </div>
        <div style={{ padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#ffffff' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>⚡ Instant Confirmation</h3>
          <p style={{ color: '#64748b' }}>Receive instant reservation details and manage or cancel active bookings effortlessly.</p>
        </div>
      </div>
    </div>
  );
};
