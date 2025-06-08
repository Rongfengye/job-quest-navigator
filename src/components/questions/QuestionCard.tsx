
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, Brain, MessageSquare, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { filterValue } from '@/utils/supabaseTypes';

export type Question = {
  question: string;
  explanation?: string;
  modelAnswer?: string;
  followUp?: string[];
  type?: 'technical' | 'behavioral' | 'original-behavioral';
  originalIndex?: number;
};

interface QuestionCardProps {
  question: Question;
  index: number;
  storylineId: string;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, index, storylineId }) => {
  const navigate = useNavigate();
  const [hasAnswer, setHasAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkForAnswer = async () => {
      try {
        const { count, error } = await supabase
          .from('storyline_job_questions')
          .select('id', { count: 'exact', head: true })
          .eq('storyline_id', filterValue(storylineId))
          .eq('question_index', index)
          .not('answer', 'is', null);
          
        if (!error && count && count > 0) {
          setHasAnswer(true);
        }
      } catch (error) {
        console.error('Error checking for answer:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkForAnswer();
  }, [storylineId, index]);

  const handleQuestionClick = () => {
    navigate(`/answer?id=${storylineId}&questionIndex=${index}`);
  };

  const formatIndex = (index: number) => {
    return index < 9 ? `0${index + 1}` : `${index + 1}`;
  };

  const getQuestionTypeConfig = (type?: string) => {
    switch (type) {
      case 'technical':
        return {
          icon: Brain,
          variant: 'secondary' as const,
          label: 'Technical',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-300'
        };
      case 'behavioral':
        return {
          icon: MessageSquare,
          variant: 'default' as const,
          label: 'Behavioral',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-300'
        };
      case 'original-behavioral':
        return {
          icon: Users,
          variant: 'outline' as const,
          label: 'From Interview',
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-800',
          borderColor: 'border-purple-300'
        };
      default:
        return {
          icon: MessageSquare,
          variant: 'default' as const,
          label: 'Question',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-300'
        };
    }
  };

  const typeConfig = getQuestionTypeConfig(question.type);
  const TypeIcon = typeConfig.icon;

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
            {hasAnswer && !isLoading && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                <CheckCircle className="w-3 h-3 mr-1" />
                Answered
              </Badge>
            )}
            <Badge 
              variant={typeConfig.variant}
              className={`${typeConfig.bgColor} ${typeConfig.textColor} ${typeConfig.borderColor}`}
            >
              <TypeIcon className="w-3 h-3 mr-1" />
              {typeConfig.label}
            </Badge>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-interview-primary transition-colors group-hover:translate-x-1 duration-300" />
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};

export default QuestionCard;
