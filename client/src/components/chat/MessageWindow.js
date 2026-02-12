import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { getMessages, markAsRead } from "../../services/chatService";
import { createMeeting } from "../../services/meetingService";
import { useNavigate } from "react-router-dom";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";
import GroupInfoModal from "./GroupInfoModal";

const MessageWindow = ({ conversation, onConversationUpdate }) => {
  const { user } = useAuth();
  const { socket, joinConversation, leaveConversation, isUserOnline } =
    useSocket();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [creatingMeeting, setCreatingMeeting] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Load messages when conversation changes
  useEffect(() => {
    if (conversation) {
      loadMessages();
      joinConversation(conversation._id);
      markConversationAsRead();

      return () => {
        leaveConversation(conversation._id);
      };
    }
  }, [conversation]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Receive new message
    socket.on("receiveMessage", (data) => {
      if (data.conversationId === conversation._id) {
        setMessages((prev) => [...prev, data.message]);
        scrollToBottom();

        // Mark as read if window is active
        if (document.hasFocus()) {
          markConversationAsRead();
        }
      }
    });

    // User typing
    socket.on("userTyping", (data) => {
      if (data.conversationId === conversation._id) {
        setTypingUsers((prev) => {
          if (!prev.find((u) => u.userId === data.userId)) {
            return [...prev, { userId: data.userId, userName: data.userName }];
          }
          return prev;
        });
      }
    });

    // User stopped typing
    socket.on("userStoppedTyping", (data) => {
      if (data.conversationId === conversation._id) {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
      }
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("userTyping");
      socket.off("userStoppedTyping");
    };
  }, [socket, conversation]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await getMessages(conversation._id);
      setMessages(response.data);
      scrollToBottom();
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const markConversationAsRead = async () => {
    try {
      await markAsRead(conversation._id);
      onConversationUpdate();
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const getConversationName = () => {
    if (conversation.isGroupChat) {
      return conversation.groupName;
    }

    const otherParticipant = conversation.participants.find(
      (p) => p._id !== user.id,
    );
    return otherParticipant?.name || "Unknown User";
  };

  const getOtherParticipantId = () => {
    if (conversation.isGroupChat) return null;
    const otherParticipant = conversation.participants.find(
      (p) => p._id !== user.id,
    );
    return otherParticipant?._id;
  };

  const formatMessageTime = (date) => {
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMessageDate = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return "Today";
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return messageDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year:
          messageDate.getFullYear() !== today.getFullYear()
            ? "numeric"
            : undefined,
      });
    }
  };

  const shouldShowDateSeparator = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;

    const currentDate = new Date(currentMessage.createdAt).toDateString();
    const previousDate = new Date(previousMessage.createdAt).toDateString();

    return currentDate !== previousDate;
  };

  const otherParticipantId = getOtherParticipantId();
  const isOnline = otherParticipantId
    ? isUserOnline(otherParticipantId)
    : false;

  // Check if current user is admin (for group chats)
  const isAdmin =
    conversation.isGroupChat &&
    (conversation.groupAdmin?._id === user?.id ||
      conversation.groupAdmin === user?.id);

  // Check if current user can create meeting (admin for groups, any participant for 1-to-1)
  const canCreateMeeting = conversation.isGroupChat ? isAdmin : true;

  const handleCreateMeeting = async () => {
    if (!canCreateMeeting) {
      alert("Only group admin can create meetings");
      return;
    }

    try {
      setCreatingMeeting(true);
      const response = await createMeeting(conversation._id);

      // Navigate to meeting room using normalized response
      navigate(`/meet/${response.meetingId}`);
    } catch (error) {
      console.error("Failed to create meeting:", error);
      alert(error.response?.data?.message || "Failed to create meeting");
    } finally {
      setCreatingMeeting(false);
    }
  };

  if (loading) {
    return (
      <div className="message-window">
        <div className="loading-messages">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="message-window">
      {/* Conversation Header */}
      <div className="message-header">
        <div className="message-header-info">
          <h2
            className={conversation.isGroupChat ? "group-name-clickable" : ""}
            onClick={() => conversation.isGroupChat && setShowGroupInfo(true)}
            style={conversation.isGroupChat ? { cursor: "pointer" } : {}}
          >
            {getConversationName()}
            {conversation.isGroupChat && (
              <span className="info-icon" title="View group info">
                {" "}
                ℹ️
              </span>
            )}
          </h2>
          {!conversation.isGroupChat && (
            <span className={`user-status ${isOnline ? "online" : "offline"}`}>
              {isOnline ? "Online" : "Offline"}
            </span>
          )}
          {conversation.isGroupChat && (
            <span className="group-participants">
              {conversation.participants.length} participants
            </span>
          )}
        </div>
        <div className="message-header-actions">
          <button
            onClick={handleCreateMeeting}
            disabled={creatingMeeting || !canCreateMeeting}
            className="btn-start-meeting"
            title={
              canCreateMeeting
                ? "Start video meeting"
                : "Only admin can create meetings"
            }
          >
            {creatingMeeting ? "⏳" : "📹"}{" "}
            {creatingMeeting ? "Creating..." : "Start Meeting"}
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="messages-container" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet</p>
            <p className="hint">Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwnMessage = message.sender._id === user.id;
              const showDateSeparator = shouldShowDateSeparator(
                message,
                messages[index - 1],
              );

              return (
                <React.Fragment key={message._id}>
                  {showDateSeparator && (
                    <div className="date-separator">
                      <span>{formatMessageDate(message.createdAt)}</span>
                    </div>
                  )}

                  <div
                    className={`message ${isOwnMessage ? "own-message" : "other-message"}`}
                  >
                    {!isOwnMessage && conversation.isGroupChat && (
                      <div className="message-sender-name">
                        {message.sender.name}
                      </div>
                    )}
                    <div className="message-bubble">
                      <p className="message-content">{message.content}</p>
                      <span className="message-time">
                        {formatMessageTime(message.createdAt)}
                      </span>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </>
        )}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <TypingIndicator
            users={typingUsers}
            isGroupChat={conversation.isGroupChat}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput conversationId={conversation._id} />

      {/* Group Info Modal */}
      {showGroupInfo && (
        <GroupInfoModal
          conversation={conversation}
          onClose={() => setShowGroupInfo(false)}
        />
      )}
    </div>
  );
};

export default MessageWindow;
