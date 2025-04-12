
import React from 'react';
import { HelpCircle } from 'lucide-react';

interface GuidingQuestionsProps {
  questions: string[] | null;
}

const GuidingQuestions: React.FC<GuidingQuestionsProps> = ({ questions }) => {
  if (!questions || questions.length === 0) {
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
    </div>
  );
};

export default GuidingQuestions;
