import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

export const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('analytics'); // analytics, users, facilities, audit
  const [report, setReport] = useState(null);
  const [users, setUsers] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'analytics') {
        const res = await axiosClient.get('/admin/reports/occupancy');
        setReport(res.data);
      } else if (activeTab === 'users') {
        const res = await axiosClient.get('/users');
        setUsers(res.data || []);
      } else if (activeTab === 'facilities') {
        const res = await axiosClient.get('/facilities');
        setFacilities(res.data || []);
      } else if (activeTab === 'audit') {
        const res = await axiosClient.get('/admin/audit-logs');
        setAuditLogs(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      await axiosClient.patch(`/admin/users/${userId}/status?status=${nextStatus}`);
      setMessage(`User status updated to ${nextStatus}`);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (email) => {
    if (!window.confirm(`Are you sure you want to permanently remove user ${email}?`)) return;
    try {
      await axiosClient.delete(`/users/by-email?email=${encodeURIComponent(email)}`);
      setMessage(`User ${email} removed successfully.`);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to remove user');
    }
  };

  const handleToggleFacilityStatus = async (facId, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await axiosClient.patch(`/admin/facilities/${facId}/status?status=${nextStatus}`);
      setMessage(`Facility status updated to ${nextStatus}`);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#0f172a' }}>🛡️ System Administrator Portal</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>System-wide oversight, user accounts management, facility status control, and security audit logs.</p>
      </div>

      {message && (
        <div style={{ padding: '0.75rem', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}>
          {message}
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('analytics')}
          style={{ padding: '0.75rem 1.5rem', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', borderBottom: activeTab === 'analytics' ? '3px solid #0284c7' : 'none', color: activeTab === 'analytics' ? '#0284c7' : '#64748b' }}
        >
          📊 Platform Metrics
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{ padding: '0.75rem 1.5rem', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', borderBottom: activeTab === 'users' ? '3px solid #0284c7' : 'none', color: activeTab === 'users' ? '#0284c7' : '#64748b' }}
        >
          👥 User Accounts Management
        </button>
        <button
          onClick={() => setActiveTab('facilities')}
          style={{ padding: '0.75rem 1.5rem', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', borderBottom: activeTab === 'facilities' ? '3px solid #0284c7' : 'none', color: activeTab === 'facilities' ? '#0284c7' : '#64748b' }}
        >
          🏢 Facility Inventory Oversight
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          style={{ padding: '0.75rem 1.5rem', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', borderBottom: activeTab === 'audit' ? '3px solid #0284c7' : 'none', color: activeTab === 'audit' ? '#0284c7' : '#64748b' }}
        >
          📜 Security & Audit Logs
        </button>
      </div>

      {loading && <p>Loading data...</p>}

      {/* TAB 1: METRICS */}
      {!loading && activeTab === 'analytics' && report && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Total Facilities</p>
            <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a' }}>{report.totalFacilities}</h3>
          </div>
          <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Total Slots Inventory</p>
            <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a' }}>{report.totalSlots}</h3>
          </div>
          <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Available Slots</p>
            <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>{report.availableSlots}</h3>
          </div>
          <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Total System Bookings</p>
            <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0284c7' }}>{report.totalReservations}</h3>
          </div>
          <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Occupancy Rate</p>
            <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>{report.occupancyRatePercentage}%</h3>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {!loading && activeTab === 'users' && (
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Name</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Email</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Role</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Status</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.75rem', fontWeight: '500' }}>{u.name}</td>
                <td style={{ padding: '0.75rem', color: '#475569' }}>{u.email}</td>
                <td style={{ padding: '0.75rem' }}>
                  <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: u.role === 'ADMIN' ? '#fef3c7' : u.role === 'OPERATOR' ? '#e0f2fe' : '#f1f5f9', color: u.role === 'ADMIN' ? '#b45309' : u.role === 'OPERATOR' ? '#0369a1' : '#475569' }}>
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: u.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2', color: u.status === 'ACTIVE' ? '#15803d' : '#b91c1c' }}>
                    {u.status}
                  </span>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <button
                    onClick={() => handleToggleUserStatus(u.id, u.status)}
                    style={{ backgroundColor: u.status === 'ACTIVE' ? '#f59e0b' : '#22c55e', color: '#ffffff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', marginRight: '0.5rem' }}
                  >
                    {u.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u.email)}
                    style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    Delete User
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* TAB 3: FACILITY OVERVIEW */}
      {!loading && activeTab === 'facilities' && (
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Facility Name</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>City / Location</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Hours</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Status</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {facilities.map((fac) => (
              <tr key={fac.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.75rem', fontWeight: '500' }}>{fac.name}</td>
                <td style={{ padding: '0.75rem', color: '#64748b' }}>{fac.address}, {fac.city}</td>
                <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{fac.openingTime} - {fac.closingTime}</td>
                <td style={{ padding: '0.75rem' }}>
                  <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: fac.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2', color: fac.status === 'ACTIVE' ? '#15803d' : '#b91c1c' }}>
                    {fac.status}
                  </span>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <button
                    onClick={() => handleToggleFacilityStatus(fac.id, fac.status)}
                    style={{ backgroundColor: fac.status === 'ACTIVE' ? '#ef4444' : '#22c55e', color: '#ffffff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    {fac.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {!loading && activeTab === 'audit' && (
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Occurred At</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Action</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Entity Type</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Actor ID</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log) => (
              <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{new Date(log.occurredAt).toLocaleString()}</td>
                <td style={{ padding: '0.75rem', fontWeight: '500' }}>{log.action}</td>
                <td style={{ padding: '0.75rem', color: '#64748b' }}>{log.entityType}</td>
                <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#94a3b8' }}>{log.actorId || 'SYSTEM'}</td>
              </tr>
            ))}
            {auditLogs.length === 0 && (
              <tr>
                <td colSpan="4" style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>No audit records logged yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};
