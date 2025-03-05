
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  storylineId: string;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, index, storylineId }) => {
  const navigate = useNavigate();

  const handleQuestionClick = () => {
    // Navigate to the answer page with the question details
    navigate(`/answer?id=${storylineId}&questionIndex=${index}`);
  };

  return (
    <Card 
      key={index} 
      className="mb-4 border-l-4 border-l-interview-primary hover:shadow-md transition-all cursor-pointer group"
      onClick={handleQuestionClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold group-hover:text-interview-primary transition-colors">
            {question.question}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={
                question.type === 'technical' ? 'secondary' : 
                question.type === 'experience' ? 'outline' : 'default'
              }
              className="ml-2"
            >
              {question.type || 'Question'}
            </Badge>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-interview-primary transition-colors group-hover:translate-x-1 duration-300" />
          </div>
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
