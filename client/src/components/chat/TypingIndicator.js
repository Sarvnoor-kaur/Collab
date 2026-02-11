import React from 'react';

const TypingIndicator = ({ users, isGroupChat }) => {
  const getTypingText = () => {
    if (users.length === 0) return '';
    
    if (isGroupChat) {
      if (users.length === 1) {
        return `${users[0].userName} is typing...`;
      } else if (users.length === 2) {
        return `${users[0].userName} and ${users[1].userName} are typing...`;
      } else {
        return `${users.length} people are typing...`;
      }
    } else {
      return 'typing...';
    }
  };

  return (
    <div className="typing-indicator">
      <div className="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span className="typing-text">{getTypingText()}</span>
    </div>
  );
};

export default TypingIndicator;
