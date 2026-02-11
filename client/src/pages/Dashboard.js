import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
  };

  const goToChat = () => {
    navigate('/chat');
  };

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-content">
          <h1>CollabSphere</h1>
          <div className="navbar-right">
            <span>Welcome, {user?.name}</span>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container dashboard">
        <div className="dashboard-card">
          <h2>Dashboard</h2>
          <p>Welcome to CollabSphere! You are successfully authenticated.</p>
          <button 
            onClick={goToChat} 
            className="btn-primary"
            style={{ marginTop: '20px', width: 'auto', padding: '12px 30px' }}
          >
            🚀 Go to Chat
          </button>
        </div>

        <div className="dashboard-card">
          <h2>User Information</h2>
          <div className="user-info">
            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Role:</strong> {user?.role}</p>
            <p><strong>User ID:</strong> {user?.id}</p>
          </div>
        </div>

        <div className="dashboard-card">
          <h2>Available Features</h2>
          <p>CollabSphere now includes:</p>
          <ul style={{ marginLeft: '20px', marginTop: '10px', color: '#666' }}>
            <li>✅ User Authentication (Phase 1)</li>
            <li>✅ Real-time Chat - One-to-One & Group (Phase 2)</li>
            <li>✅ Typing Indicators</li>
            <li>✅ Online/Offline Status</li>
            <li>✅ Read Receipts</li>
            <li>🔜 Video Conferencing (Phase 3)</li>
            <li>🔜 AI-powered Features (Phase 4)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
