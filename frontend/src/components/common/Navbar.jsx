import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{ backgroundColor: '#1e293b', color: '#ffffff', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
        <Link to="/" style={{ color: '#38bdf8', textDecoration: 'none' }}>🅿️ SmartPark</Link>
      </div>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <Link to="/search" style={{ color: '#f8fafc', textDecoration: 'none' }}>Find Parking</Link>
        {user ? (
          <>
            <Link to="/my-reservations" style={{ color: '#f8fafc', textDecoration: 'none' }}>My Bookings</Link>
            
            {/* Separate UI Portals based on Role */}
            {(user.role === 'OPERATOR' || user.role === 'ADMIN') && (
              <Link to="/operator" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: '500' }}>🚧 Operator Portal</Link>
            )}
            {user.role === 'ADMIN' && (
              <Link to="/admin" style={{ color: '#f43f5e', textDecoration: 'none', fontWeight: '500' }}>🛡️ Admin Portal</Link>
            )}
            
            <span style={{ color: '#94a3b8' }}>Hi, {user.name}</span>
            <button onClick={handleLogout} style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: '#f8fafc', textDecoration: 'none' }}>Sign In</Link>
            <Link to="/register" style={{ backgroundColor: '#0284c7', color: '#ffffff', textDecoration: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px' }}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};
