import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import ConversationList from '../components/chat/ConversationList';
import MessageWindow from '../components/chat/MessageWindow';
import NewChatModal from '../components/chat/NewChatModal';
import { getConversations } from '../services/chatService';
import '../styles/Chat.css';

const Chat = () => {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, []);

  // Handle conversation from navigation state
  useEffect(() => {
    if (location.state?.selectedConversation) {
      setSelectedConversation(location.state.selectedConversation);
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await getConversations();
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
  };

  const handleNewConversation = (conversation) => {
    setConversations(prev => [conversation, ...prev]);
    setSelectedConversation(conversation);
    setShowNewChatModal(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  const goToDiscovery = () => {
    navigate('/discover');
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <h1>CollabSphere Chat</h1>
          <span className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '● Connected' : '○ Disconnected'}
          </span>
        </div>
        <div className="chat-header-right">
          <button onClick={goToDiscovery} className="btn-discover">
            🔍 Discover Users
          </button>
          <span className="user-name">{user?.name}</span>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        {/* Conversation List Sidebar */}
        <div className="chat-sidebar">
          <div className="sidebar-header">
            <h2>Conversations</h2>
            <button 
              className="btn-new-chat"
              onClick={() => setShowNewChatModal(true)}
            >
              + New Chat
            </button>
          </div>
          
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={handleConversationSelect}
            loading={loading}
          />
        </div>

        {/* Message Window */}
        <div className="chat-content">
          {selectedConversation ? (
            <MessageWindow
              conversation={selectedConversation}
              onConversationUpdate={loadConversations}
            />
          ) : (
            <div className="no-conversation-selected">
              <div className="empty-state">
                <h2>Welcome to CollabSphere Chat</h2>
                <p>Select a conversation or start a new chat</p>
                <button 
                  className="btn-primary"
                  onClick={() => setShowNewChatModal(true)}
                >
                  Start New Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <NewChatModal
          onClose={() => setShowNewChatModal(false)}
          onConversationCreated={handleNewConversation}
        />
      )}
    </div>
  );
};

export default Chat;
