
import React, { useState, useEffect } from 'react';

interface LoadingProps {
  message?: string;
  messages?: string[];
  interval?: number;
}

const Loading: React.FC<LoadingProps> = ({ 
  message = 'Loading...', 
  messages,
  interval = 1500
}) => {
  const [messageIndex, setMessageIndex] = useState(0);
  
  const initialMessages = [
    "Setting up your interview experience…",
    "Generating your first challenge…",
    "Getting your first question ready…",
    "Warming up the interview engine…"
  ];
  
  const displayMessages = messages || initialMessages;
  const showRotatingMessages = Array.isArray(messages) || messages === undefined;
  
  useEffect(() => {
    if (!showRotatingMessages) return;
    
    const rotationInterval = setInterval(() => {
      setMessageIndex(prevIndex => (prevIndex + 1) % displayMessages.length);
    }, interval);
    
    return () => clearInterval(rotationInterval);
  }, [displayMessages.length, interval, showRotatingMessages]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-interview-primary mx-auto mb-4"></div>
        <p className="text-gray-600">
          {showRotatingMessages ? displayMessages[messageIndex] : message}
        </p>
      </div>
    </div>
  );
};

export default Loading;
