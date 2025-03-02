
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface ErrorDisplayProps {
  message: string | null;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message }) => {
  if (!message) return null;
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <h3 className="text-red-800 font-semibold">Error</h3>
      <p className="text-red-600">{message}</p>
      <p className="text-red-600 mt-2">Please check the console for more details or try again.</p>
    </div>
  );
};

export default ErrorDisplay;
