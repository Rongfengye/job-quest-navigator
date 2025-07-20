
import React, { useState, useEffect } from 'react';
import CircularProgress from './circular-progress';

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
  const [progress, setProgress] = useState(0);
  
  const transitionMessages = [
    "Reviewing your last response…",
    "Summarizing key points…",
    "Shaping the next question…",
    "Crafting your next behavioral challenge…",
    "Preparing the next step for you…"
  ];
  
  const displayMessages = messages || transitionMessages;
  const showRotatingMessages = Array.isArray(messages) || messages === undefined;
  
  // Progress simulation effect
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    
    const simulateProgress = () => {
      let currentProgress = 0;
      
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 20) {
            // Quick start: 0-20% in first 1 second
            return prev + 4;
          } else if (prev < 70) {
            // Steady progress: 20-70% over next 3 seconds
            return prev + 1.5;
          } else if (prev < 95) {
            // Slowing down: 70-95% over next 1.5 seconds
            return prev + 0.8;
          } else {
            // Stay at 95% until completion
            return 95;
          }
        });
      }, 100);
    };

    simulateProgress();
    
    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, []);
  
  // Message rotation effect
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
        <div className="mb-4">
          <CircularProgress progress={progress} size={48} />
        </div>
        <p className="text-gray-600">
          {showRotatingMessages ? displayMessages[messageIndex] : message}
        </p>
      </div>
    </div>
  );
};

export default Loading;
