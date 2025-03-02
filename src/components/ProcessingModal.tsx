
import React from 'react';

interface ProcessingModalProps {
  isOpen: boolean;
}

const ProcessingModal: React.FC<ProcessingModalProps> = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-interview-primary">Creating Your Interview Questions</h2>
        <p className="mb-6 text-gray-600">
          We're analyzing your job details and generating tailored interview questions. This may take a few minutes.
        </p>
        <p className="text-gray-600">We'll redirect you to your questions once they're ready.</p>
        <div className="flex justify-center mt-6">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-interview-primary"></div>
        </div>
      </div>
    </div>
  );
};

export default ProcessingModal;
