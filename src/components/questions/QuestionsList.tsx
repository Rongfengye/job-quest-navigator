
import React from 'react';
import { FileText } from 'lucide-react';
import QuestionCard, { Question } from './QuestionCard';

interface QuestionsListProps {
  questions: Question[];
  storylineId: string;
}

const QuestionsList: React.FC<QuestionsListProps> = ({ questions, storylineId }) => {
  if (!questions.length) {
    return (
      <p className="text-gray-500 italic py-4">
        No questions available. OpenAI might not have generated them correctly.
      </p>
    );
  }

  return (
    <div className="pt-2">
      <div className="flex items-center mb-4">
        <FileText className="w-5 h-5 mr-2 text-interview-primary" />
        <h2 className="text-xl font-semibold">Practice Interview Questions</h2>
      </div>
      {questions.map((question, index) => (
        <QuestionCard 
          key={index} 
          question={question} 
          index={index} 
          storylineId={storylineId} 
        />
      ))}
    </div>
  );
};

export default QuestionsList;
