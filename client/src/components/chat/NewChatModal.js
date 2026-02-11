import React, { useState, useEffect } from 'react';
import { searchUsers } from '../../services/chatService';
import { createConversation, createGroupConversation } from '../../services/chatService';

const NewChatModal = ({ onClose, onConversationCreated }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (searchQuery.trim()) {
      const delayDebounce = setTimeout(() => {
        handleSearch();
      }, 300);

      return () => clearTimeout(delayDebounce);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSearch = async () => {
    try {
      setLoading(true);
      const response = await searchUsers(searchQuery);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = async (user) => {
    if (isGroupChat) {
      // For group chat, add to selected users
      if (!selectedUsers.find(u => u._id === user._id)) {
        setSelectedUsers([...selectedUsers, user]);
      }
    } else {
      // For one-to-one chat, create conversation immediately
      try {
        setLoading(true);
        const response = await createConversation(user._id);
        onConversationCreated(response.data);
      } catch (error) {
        console.error('Failed to create conversation:', error);
        setError('Failed to create conversation');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u._id !== userId));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }

    if (selectedUsers.length < 1) {
      setError('Please select at least one user');
      return;
    }

    try {
      setLoading(true);
      const participantIds = selectedUsers.map(u => u._id);
      const response = await createGroupConversation(participantIds, groupName);
      onConversationCreated(response.data);
    } catch (error) {
      console.error('Failed to create group:', error);
      setError('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isGroupChat ? 'Create Group Chat' : 'New Chat'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Chat Type Toggle */}
          <div className="chat-type-toggle">
            <button
              className={`toggle-btn ${!isGroupChat ? 'active' : ''}`}
              onClick={() => setIsGroupChat(false)}
            >
              One-to-One
            </button>
            <button
              className={`toggle-btn ${isGroupChat ? 'active' : ''}`}
              onClick={() => setIsGroupChat(true)}
            >
              Group Chat
            </button>
          </div>

          {/* Group Name Input */}
          {isGroupChat && (
            <div className="form-group">
              <input
                type="text"
                className="form-input"
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
          )}

          {/* Selected Users (for group chat) */}
          {isGroupChat && selectedUsers.length > 0 && (
            <div className="selected-users">
              <p className="selected-users-label">Selected Users:</p>
              <div className="selected-users-list">
                {selectedUsers.map(user => (
                  <div key={user._id} className="selected-user-chip">
                    <span>{user.name}</span>
                    <button onClick={() => handleRemoveUser(user._id)}>×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Input */}
          <div className="form-group">
            <input
              type="text"
              className="form-input"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">{error}</div>
          )}

          {/* Search Results */}
          <div className="search-results">
            {loading && <div className="loading">Searching...</div>}
            
            {!loading && searchResults.length === 0 && searchQuery && (
              <div className="no-results">No users found</div>
            )}

            {!loading && searchResults.length > 0 && (
              <div className="user-list">
                {searchResults.map(user => (
                  <div
                    key={user._id}
                    className={`user-item ${selectedUsers.find(u => u._id === user._id) ? 'selected' : ''}`}
                    onClick={() => handleUserSelect(user)}
                  >
                    <div className="user-avatar">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                      <p className="user-name">{user.name}</p>
                      <p className="user-email">{user.email}</p>
                    </div>
                    {selectedUsers.find(u => u._id === user._id) && (
                      <span className="checkmark">✓</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create Group Button */}
          {isGroupChat && selectedUsers.length > 0 && (
            <button
              className="btn-primary btn-create-group"
              onClick={handleCreateGroup}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
