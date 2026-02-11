import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  // Initialize socket connection
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No token found for socket connection');
        return;
      }

      // Create socket connection with authentication
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5001', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        setConnected(false);
      });

      // Handle user online/offline events
      newSocket.on('userOnline', (data) => {
        setOnlineUsers(prev => {
          if (!prev.includes(data.userId)) {
            return [...prev, data.userId];
          }
          return prev;
        });
      });

      newSocket.on('userOffline', (data) => {
        setOnlineUsers(prev => prev.filter(id => id !== data.userId));
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        newSocket.close();
      };
    } else {
      // Disconnect socket if user logs out
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
      }
    }
  }, [user]);

  // Join conversation room
  const joinConversation = useCallback((conversationId) => {
    if (socket && connected) {
      socket.emit('joinConversation', { conversationId });
      console.log('Joined conversation:', conversationId);
    }
  }, [socket, connected]);

  // Leave conversation room
  const leaveConversation = useCallback((conversationId) => {
    if (socket && connected) {
      socket.emit('leaveConversation', { conversationId });
      console.log('Left conversation:', conversationId);
    }
  }, [socket, connected]);

  // Send message
  const sendMessage = useCallback((conversationId, content, messageType = 'text', fileUrl = null, fileName = null) => {
    if (socket && connected) {
      socket.emit('sendMessage', {
        conversationId,
        content,
        messageType,
        fileUrl,
        fileName
      });
    }
  }, [socket, connected]);

  // Send typing indicator
  const sendTyping = useCallback((conversationId) => {
    if (socket && connected) {
      socket.emit('typing', { conversationId });
    }
  }, [socket, connected]);

  // Send stop typing indicator
  const sendStopTyping = useCallback((conversationId) => {
    if (socket && connected) {
      socket.emit('stopTyping', { conversationId });
    }
  }, [socket, connected]);

  // Mark message as read
  const markMessageAsRead = useCallback((messageId, conversationId) => {
    if (socket && connected) {
      socket.emit('messageRead', { messageId, conversationId });
    }
  }, [socket, connected]);

  // Check if user is online
  const isUserOnline = useCallback((userId) => {
    return onlineUsers.includes(userId);
  }, [onlineUsers]);

  const value = {
    socket,
    connected,
    onlineUsers,
    joinConversation,
    leaveConversation,
    sendMessage,
    sendTyping,
    sendStopTyping,
    markMessageAsRead,
    isUserOnline
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
