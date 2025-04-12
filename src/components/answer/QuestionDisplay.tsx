
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Question } from '@/hooks/useQuestionData';

interface QuestionDisplayProps {
  question: Question;
  questionIndex: number;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ question, questionIndex }) => {
  const formatQuestionIndex = (index: number) => {
    return index < 9 ? `0${index + 1}` : `${index + 1}`;
  };

  return (
    <Card className="mb-8">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-gray-500 font-mono font-medium">{formatQuestionIndex(questionIndex)}</span>
            <CardTitle className="text-xl">Question</CardTitle>
          </div>
          {question.type && (
            <Badge 
              variant={question.type === 'technical' ? 'secondary' : 'default'}
            >
              {question.type}
            </Badge>
          )}
        </div>
        <CardDescription className="text-lg font-medium text-gray-800 mt-2">
          {question.question}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {question.explanation && (
          <div className="mb-4 p-4 bg-gray-50 rounded-md">
            <p className="text-sm font-medium text-gray-700">Why this matters:</p>
            <p className="text-sm text-gray-600 mt-1">{question.explanation}</p>
          </div>
        )}
        
        {question.followUp && question.followUp.length > 0 && (
          <div className="mt-4">
            <p className="font-medium text-sm text-gray-700">Follow-up questions to consider:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {question.followUp.map((followUpQ, idx) => (
                <li key={idx} className="text-sm text-gray-600">{followUpQ}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionDisplay;
