import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const ConversationList = ({ conversations, selectedConversation, onSelectConversation, loading }) => {
  const { user } = useAuth();
  const { isUserOnline } = useSocket();

  const getConversationName = (conversation) => {
    if (conversation.isGroupChat) {
      return conversation.groupName;
    }
    
    // For one-to-one, show the other participant's name
    const otherParticipant = conversation.participants.find(
      p => p._id !== user.id
    );
    return otherParticipant?.name || 'Unknown User';
  };

  const getConversationAvatar = (conversation) => {
    if (conversation.isGroupChat) {
      return conversation.groupName.charAt(0).toUpperCase();
    }
    
    const otherParticipant = conversation.participants.find(
      p => p._id !== user.id
    );
    return otherParticipant?.name.charAt(0).toUpperCase() || '?';
  };

  const getOtherParticipantId = (conversation) => {
    if (conversation.isGroupChat) return null;
    const otherParticipant = conversation.participants.find(
      p => p._id !== user.id
    );
    return otherParticipant?._id;
  };

  const formatLastMessageTime = (date) => {
    if (!date) return '';
    
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (loading) {
    return (
      <div className="conversation-list">
        <div className="loading-conversations">Loading conversations...</div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="conversation-list">
        <div className="no-conversations">
          <p>No conversations yet</p>
          <p className="hint">Start a new chat to begin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="conversation-list">
      {conversations.map((conversation) => {
        const isSelected = selectedConversation?._id === conversation._id;
        const otherParticipantId = getOtherParticipantId(conversation);
        const isOnline = otherParticipantId ? isUserOnline(otherParticipantId) : false;

        return (
          <div
            key={conversation._id}
            className={`conversation-item ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelectConversation(conversation)}
          >
            <div className="conversation-avatar">
              {getConversationAvatar(conversation)}
              {!conversation.isGroupChat && isOnline && (
                <span className="online-indicator"></span>
              )}
            </div>
            
            <div className="conversation-info">
              <div className="conversation-header">
                <h3 className="conversation-name">
                  {getConversationName(conversation)}
                </h3>
                {conversation.lastMessage && (
                  <span className="conversation-time">
                    {formatLastMessageTime(conversation.lastMessage.createdAt)}
                  </span>
                )}
              </div>
              
              {conversation.lastMessage && (
                <p className="conversation-last-message">
                  {conversation.lastMessage.sender._id === user.id ? 'You: ' : ''}
                  {conversation.lastMessage.content.length > 50
                    ? conversation.lastMessage.content.substring(0, 50) + '...'
                    : conversation.lastMessage.content}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ConversationList;
