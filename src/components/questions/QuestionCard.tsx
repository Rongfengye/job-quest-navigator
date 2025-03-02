
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export type Question = {
  question: string;
  explanation?: string;
  modelAnswer?: string;
  followUp?: string[];
  type?: 'technical' | 'behavioral' | 'experience';
};

interface QuestionCardProps {
  question: Question;
  index: number;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, index }) => {
  return (
    <Card key={index} className="mb-4 border-l-4 border-l-interview-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{question.question}</CardTitle>
          <Badge 
            variant={
              question.type === 'technical' ? 'secondary' : 
              question.type === 'experience' ? 'outline' : 'default'
            }
            className="ml-2"
          >
            {question.type || 'Question'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-gray-600">
          <strong>Why this matters:</strong> {question.explanation || question.modelAnswer || "No explanation provided."}
        </CardDescription>
        
        {question.followUp && question.followUp.length > 0 && (
          <div className="mt-4">
            <p className="font-medium text-sm text-gray-700">Follow-up questions:</p>
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

export default QuestionCard;
