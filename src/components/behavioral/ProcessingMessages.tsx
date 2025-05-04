
import React, { useState, useEffect } from 'react';

interface ProcessingMessagesProps {
  currentQuestionIndex?: number;
  isNextQuestion?: boolean;
}

const ProcessingMessages: React.FC<ProcessingMessagesProps> = ({
  currentQuestionIndex = 0,
  isNextQuestion = false,
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
  
  const messages = isNextQuestion ? processingMessages : finalProcessingMessages;
  
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prevIndex => (prevIndex + 1) % messages.length);
    }, 1500);
    
    return () => clearInterval(interval);
  }, [messages.length]);
  
  return (
    <div className="text-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-interview-primary mb-4 mx-auto"></div>
      <p className="text-gray-600 transition-opacity duration-500">
        {messages[messageIndex]}
      </p>
    </div>
  );
};

export default ProcessingMessages;
