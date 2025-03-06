
import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';

interface ProcessingModalProps {
  isOpen: boolean;
}

const ProcessingModal: React.FC<ProcessingModalProps> = ({ isOpen }) => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      return;
    }
    
    // Simulate progress updates
    const interval = setInterval(() => {
      setProgress(prevProgress => {
        // Slow down progress as it approaches 90%
        if (prevProgress >= 90) {
          return prevProgress + 0.2;
        } else if (prevProgress >= 75) {
          return prevProgress + 0.5;
        } else {
          return prevProgress + 2;
        }
      });
    }, 300);
    
    return () => clearInterval(interval);
  }, [isOpen]);
  
  // Reset progress when modal closes
  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
    }
  }, [isOpen]);
  
  if (!isOpen) return null;

  // Cap the displayed progress at 99% until the real process completes
  const displayProgress = Math.min(Math.round(progress), 99);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-interview-primary">Creating Your Interview Questions</h2>
        <p className="mb-6 text-gray-600">
          We're analyzing your job details and generating tailored interview questions. This may take a few minutes.
        </p>
        <p className="text-gray-600 mb-4">We'll redirect you to your questions once they're ready.</p>
        
        <div className="mb-2">
          <Progress value={displayProgress} className="h-2" />
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>Processing...</span>
          <span>{displayProgress}%</span>
        </div>
      </div>
    </div>
  );
};

export default ProcessingModal;
