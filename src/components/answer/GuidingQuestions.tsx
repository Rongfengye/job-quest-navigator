
import React, { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import GuidedResponseChat from './GuidedResponseChat';

interface GuidingQuestionsProps {
  questions: string[] | null;
  onResponseGenerated: (response: string) => void;
  isLoading: boolean;
}

const GuidingQuestions: React.FC<GuidingQuestionsProps> = ({ 
  questions, 
  onResponseGenerated,
  isLoading 
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Reset visibility when new questions are provided
    if (questions && questions.length > 0) {
      setVisible(true);
    }
  }, [questions]);

  // Listen for response received event to hide the section
  useEffect(() => {
    const handleResponseReceived = () => {
      setVisible(false);
    };

    window.addEventListener('responseReceived' as any, handleResponseReceived);
    
    return () => {
      window.removeEventListener('responseReceived' as any, handleResponseReceived);
    };
  }, []);

  if (!questions || questions.length === 0 || !visible) {
    return null;
  }

  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-blue-500" />
        Guiding Questions
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Consider these questions to help structure and improve your answer:
      </p>
      <ul className="space-y-3 pl-2">
        {questions.map((question, index) => (
          <li key={`question-${index}`} className="flex gap-2">
            <span className="font-medium text-blue-600">{index + 1}.</span>
            <span className="text-gray-800">{question}</span>
          </li>
        ))}
      </ul>
      
      <GuidedResponseChat 
        questions={questions} 
        onResponseGenerated={onResponseGenerated}
        isLoading={isLoading}
      />
    </div>
  );
};

export default GuidingQuestions;
