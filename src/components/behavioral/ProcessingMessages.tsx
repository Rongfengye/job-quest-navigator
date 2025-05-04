
import React, { useState, useEffect } from 'react';

interface ProcessingMessagesProps {
  currentQuestionIndex?: number;
  isNextQuestion?: boolean;
  messages?: string[];
  interval?: number;
}

const ProcessingMessages: React.FC<ProcessingMessagesProps> = ({
  currentQuestionIndex = 0,
  isNextQuestion = false,
  messages,
  interval = 1500,
}) => {
  const [messageIndex, setMessageIndex] = useState(0);
  
  const processingMessages = [
    "Reviewing your last response…",
    "Summarizing key points…",
    "Shaping the next question…",
    "Crafting the next challenge…",
    "Preparing the next step for you…"
  ];
  
  const finalProcessingMessages = [
    "Analyzing your interview responses…",
    "Evaluating your communication skills…",
    "Compiling comprehensive feedback…",
    "Creating your interview report…",
    "Finalizing your performance evaluation…"
  ];
  
  const displayMessages = messages || (isNextQuestion ? processingMessages : finalProcessingMessages);
  
  useEffect(() => {
    const rotationInterval = setInterval(() => {
      setMessageIndex(prevIndex => (prevIndex + 1) % displayMessages.length);
    }, interval);
    
    return () => clearInterval(rotationInterval);
  }, [displayMessages.length, interval]);
  
  return (
    <div className="text-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-interview-primary mb-4 mx-auto"></div>
      <p className="text-gray-600 transition-opacity duration-500">
        {displayMessages[messageIndex]}
      </p>
    </div>
  );
};

export default ProcessingMessages;
