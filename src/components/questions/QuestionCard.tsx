
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  const formatIndex = (index: number) => {
    return index < 9 ? `0${index + 1}` : `${index + 1}`;
  };

  return (
    <Card 
      key={index} 
      className="mb-4 hover:shadow-md transition-all cursor-pointer group"
      onClick={handleQuestionClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <span className="text-gray-500 font-mono font-medium">{formatIndex(index)}</span>
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-800 group-hover:text-interview-primary transition-colors">
              {question.question}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {question.type && (
              <Badge 
                variant={
                  question.type === 'technical' ? 'secondary' : 
                  question.type === 'experience' ? 'outline' : 'default'
                }
              >
                {question.type}
              </Badge>
            )}
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-interview-primary transition-colors group-hover:translate-x-1 duration-300" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {question.explanation && (
          <p className="text-gray-600 text-sm line-clamp-2">
            {question.explanation}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionCard;
