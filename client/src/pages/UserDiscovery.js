import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getAllUsers, searchUsers } from '../services/userService';
import { createConversation } from '../services/chatService';
import '../styles/UserDiscovery.css';

const UserDiscovery = () => {
  const { user, logout } = useAuth();
  const { isUserOnline, connected } = useSocket();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  // Load all users on mount
  useEffect(() => {
    loadAllUsers();
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim()) {
      const delayDebounce = setTimeout(() => {
        handleSearch();
      }, 300);

      return () => clearTimeout(delayDebounce);
    } else {
      loadAllUsers();
    }
  }, [searchQuery]);

  const loadAllUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getAllUsers();
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setSearching(true);
      setError('');
      const response = await searchUsers(searchQuery);
      setUsers(response.data);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleStartChat = async (selectedUser) => {
    try {
      setLoading(true);
      
      // Create or get conversation
      const response = await createConversation(selectedUser._id);
      
      // Navigate to chat with the conversation
      navigate('/chat', { 
        state: { 
          selectedConversation: response.data 
        } 
      });
    } catch (err) {
      console.error('Failed to start chat:', err);
      setError('Failed to start chat');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const goToChat = () => {
    navigate('/chat');
  };

  const getUserInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="user-discovery-container">
      {/* Header */}
      <div className="discovery-header">
        <div className="discovery-header-left">
          <h1>CollabSphere</h1>
          <span className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '● Connected' : '○ Disconnected'}
          </span>
        </div>
        <div className="discovery-header-right">
          <button onClick={goToChat} className="btn-chat">
            💬 My Chats
          </button>
          <span className="user-name">{user?.name}</span>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="discovery-main">
        <div className="discovery-content">
          <div className="discovery-title">
            <h2>Discover Users</h2>
            <p>Find and connect with other users on CollabSphere</p>
          </div>

          {/* Search Bar */}
          <div className="search-section">
            <div className="search-input-wrapper">
              <input
                type="text"
                className="search-input"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searching && <span className="search-loading">Searching...</span>}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">{error}</div>
          )}

          {/* Users List */}
          <div className="users-section">
            {loading ? (
              <div className="loading-users">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="no-users">
                <p>No users found</p>
                {searchQuery && (
                  <p className="hint">Try a different search term</p>
                )}
              </div>
            ) : (
              <div className="users-grid">
                {users.map((discoveredUser) => {
                  const online = isUserOnline(discoveredUser._id);
                  
                  return (
                    <div key={discoveredUser._id} className="user-card">
                      <div className="user-card-header">
                        <div className="user-avatar-large">
                          {getUserInitial(discoveredUser.name)}
                          {online && <span className="online-badge"></span>}
                        </div>
                        <div className={`status-badge ${online ? 'online' : 'offline'}`}>
                          {online ? '🟢 Online' : '⚪ Offline'}
                        </div>
                      </div>
                      
                      <div className="user-card-body">
                        <h3 className="user-card-name">{discoveredUser.name}</h3>
                        <p className="user-card-email">{discoveredUser.email}</p>
                        <p className="user-card-joined">
                          Joined {formatDate(discoveredUser.createdAt)}
                        </p>
                      </div>
                      
                      <div className="user-card-footer">
                        <button
                          className="btn-start-chat"
                          onClick={() => handleStartChat(discoveredUser)}
                          disabled={loading}
                        >
                          💬 Start Chat
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Stats */}
          {!loading && users.length > 0 && (
            <div className="discovery-stats">
              <p>
                Showing {users.length} user{users.length !== 1 ? 's' : ''}
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDiscovery;
