import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFacilities = async (searchQuery = '') => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(`/facilities${searchQuery ? `?query=${encodeURIComponent(searchQuery)}` : ''}`);
      setFacilities(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load parking facilities.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchFacilities(query);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1rem' }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Find Parking Facilities</h2>
      
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        <input
          type="text"
          placeholder="Search by city, area, or facility name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1, padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
        />
        <button
          type="submit"
          style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
        >
          Search
        </button>
      </form>

      {loading && <p>Loading parking facilities...</p>}
      {error && <p style={{ color: '#ef4444' }}>{error}</p>}

      {!loading && facilities.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
          <p style={{ color: '#64748b' }}>No parking facilities found matching your criteria.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {facilities.map((fac) => (
          <div key={fac.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem', backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.25rem' }}>{fac.name}</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.5rem' }}>📍 {fac.address}, {fac.city}</p>
            <p style={{ color: '#475569', fontSize: '0.85rem', marginBottom: '1rem' }}>🕒 Hours: {fac.openingTime} - {fac.closingTime}</p>
            <Link
              to={`/facilities/${fac.id}`}
              style={{ display: 'inline-block', backgroundColor: '#0284c7', color: '#ffffff', padding: '0.5rem 1rem', borderRadius: '4px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}
            >
              View Available Slots →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};
