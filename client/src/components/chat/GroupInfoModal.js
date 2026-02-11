import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

const GroupInfoModal = ({ conversation, onClose }) => {
  const { user } = useAuth();
  const { isUserOnline } = useSocket();
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    if (conversation && conversation.participants) {
      setParticipants(conversation.participants);
    }
  }, [conversation]);

  if (!conversation || !conversation.isGroupChat) {
    return null;
  }

  const isAdmin = conversation.groupAdmin?._id === user?.id || 
                  conversation.groupAdmin === user?.id;

  const getUserInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content group-info-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Group Information</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Group Details */}
          <div className="group-details-section">
            <div className="group-avatar-large">
              {getUserInitial(conversation.groupName)}
            </div>
            <h3 className="group-name-large">{conversation.groupName}</h3>
            <p className="group-created">
              Created {formatDate(conversation.createdAt)}
            </p>
          </div>

          {/* Group Admin */}
          <div className="group-section">
            <h4 className="section-title">Group Admin</h4>
            <div className="participant-list">
              {conversation.groupAdmin && (
                <div className="participant-item admin-item">
                  <div className="participant-avatar">
                    {getUserInitial(
                      conversation.groupAdmin.name || 
                      participants.find(p => p._id === conversation.groupAdmin)?.name
                    )}
                    {isUserOnline(
                      conversation.groupAdmin._id || conversation.groupAdmin
                    ) && (
                      <span className="online-indicator-small"></span>
                    )}
                  </div>
                  <div className="participant-info">
                    <p className="participant-name">
                      {conversation.groupAdmin.name || 
                       participants.find(p => p._id === conversation.groupAdmin)?.name}
                      {(conversation.groupAdmin._id === user?.id || 
                        conversation.groupAdmin === user?.id) && (
                        <span className="you-badge"> (You)</span>
                      )}
                    </p>
                    <p className="participant-email">
                      {conversation.groupAdmin.email || 
                       participants.find(p => p._id === conversation.groupAdmin)?.email}
                    </p>
                  </div>
                  <div className="participant-status">
                    <span className="admin-badge">Admin</span>
                    <span className={`status-dot ${
                      isUserOnline(conversation.groupAdmin._id || conversation.groupAdmin) 
                        ? 'online' 
                        : 'offline'
                    }`}>
                      {isUserOnline(conversation.groupAdmin._id || conversation.groupAdmin)
                        ? '🟢 Online'
                        : '⚪ Offline'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Participants */}
          <div className="group-section">
            <h4 className="section-title">
              Participants ({participants.length})
            </h4>
            <div className="participant-list">
              {participants
                .filter(p => p._id !== (conversation.groupAdmin?._id || conversation.groupAdmin))
                .map((participant) => {
                  const online = isUserOnline(participant._id);
                  const isCurrentUser = participant._id === user?.id;

                  return (
                    <div key={participant._id} className="participant-item">
                      <div className="participant-avatar">
                        {getUserInitial(participant.name)}
                        {online && <span className="online-indicator-small"></span>}
                      </div>
                      <div className="participant-info">
                        <p className="participant-name">
                          {participant.name}
                          {isCurrentUser && <span className="you-badge"> (You)</span>}
                        </p>
                        <p className="participant-email">{participant.email}</p>
                      </div>
                      <div className="participant-status">
                        <span className={`status-dot ${online ? 'online' : 'offline'}`}>
                          {online ? '🟢 Online' : '⚪ Offline'}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Group Stats */}
          <div className="group-section">
            <h4 className="section-title">Group Statistics</h4>
            <div className="group-stats">
              <div className="stat-item">
                <span className="stat-label">Total Members:</span>
                <span className="stat-value">{participants.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Online Now:</span>
                <span className="stat-value">
                  {participants.filter(p => isUserOnline(p._id)).length}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Your Role:</span>
                <span className="stat-value">{isAdmin ? 'Admin' : 'Member'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupInfoModal;
