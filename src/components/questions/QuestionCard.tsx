
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, Brain, MessageSquare, Users, Globe, Shield, Star, ExternalLink } from 'lucide-react';
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
  sourceAttribution?: {
    source: string;
    reliability: number;
    category: string;
    platform?: string;
  };
};

interface QuestionCardProps {
  question: Question;
  index: number;
  storylineId: string;
  mode?: string;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, index, storylineId, mode = 'manual' }) => {
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
    // Pass question data and mode through navigation state
    navigate(`/answer?id=${storylineId}&questionIndex=${index}&mode=${mode}`, {
      state: { question }
    });
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

  const getSourceConfig = (sourceAttribution?: Question['sourceAttribution']) => {
    if (!sourceAttribution) return null;
    
    const { source, reliability, category, platform } = sourceAttribution;
    
    const configs: Record<string, any> = {
      'glassdoor-verified': {
        icon: Shield,
        label: 'Glassdoor Verified',
        variant: 'default',
        bgColor: 'bg-emerald-100',
        textColor: 'text-emerald-800',
        borderColor: 'border-emerald-300'
      },
      'blind-verified': {
        icon: Shield,
        label: 'Blind Verified',
        variant: 'default',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-300'
      },
      'company-official': {
        icon: Shield,
        label: 'Company Official',
        variant: 'default',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-800',
        borderColor: 'border-purple-300'
      },
      'reddit-cscareerquestions': {
        icon: ExternalLink,
        label: 'Reddit Community',
        variant: 'secondary',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
        borderColor: 'border-orange-300'
      },
      'reddit-internships': {
        icon: ExternalLink,
        label: 'Reddit Internships',
        variant: 'secondary',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
        borderColor: 'border-orange-300'
      },
      'reddit-company': {
        icon: ExternalLink,
        label: 'Reddit Company',
        variant: 'secondary',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
        borderColor: 'border-orange-300'
      },
      'forum-general': {
        icon: Globe,
        label: 'Forum Source',
        variant: 'secondary',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        borderColor: 'border-gray-300'
      },
      'ai-generated': {
        icon: Brain,
        label: 'AI Generated',
        variant: 'outline',
        bgColor: 'bg-slate-100',
        textColor: 'text-slate-800',
        borderColor: 'border-slate-300'
      },
      'behavioral-practice-session': {
        icon: Users,
        label: 'Practice Session',
        variant: 'outline',
        bgColor: 'bg-violet-100',
        textColor: 'text-violet-800',
        borderColor: 'border-violet-300'
      }
    };
    
    return configs[source] || {
      icon: Globe,
      label: platform || 'External Source',
      variant: 'secondary',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      borderColor: 'border-gray-300'
    };
  };

  const typeConfig = getQuestionTypeConfig(question.type);
  const sourceConfig = getSourceConfig(question.sourceAttribution);
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
            {sourceConfig && (
              <Badge 
                variant={sourceConfig.variant}
                className={`${sourceConfig.bgColor} ${sourceConfig.textColor} ${sourceConfig.borderColor}`}
                title={`Source: ${sourceConfig.label} | Reliability: ${question.sourceAttribution?.reliability}/5`}
              >
                <sourceConfig.icon className="w-3 h-3 mr-1" />
                {sourceConfig.label}
                {question.sourceAttribution && question.sourceAttribution.reliability >= 4 && (
                  <Star className="w-3 h-3 ml-1 fill-current" />
                )}
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
        {question.sourceAttribution && (
          <div className="mt-2 text-xs text-gray-500">
            Source reliability: {question.sourceAttribution.reliability}/5 | Category: {question.sourceAttribution.category}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionCard;
