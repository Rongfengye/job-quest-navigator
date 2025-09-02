
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Question } from '@/hooks/useQuestionData';
import { SourceBadge } from '@/components/questions/SourceBadge';

interface QuestionDisplayProps {
  question: Question;
  questionIndex: number;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ question, questionIndex }) => {
  const [showFollowUp, setShowFollowUp] = useState(false);
  
  const formatQuestionIndex = (index: number) => {
    return index < 9 ? `0${index + 1}` : `${index + 1}`;
  };

  return (
    <TooltipProvider>
      <Card className="mb-8">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-gray-500 font-mono font-medium">{formatQuestionIndex(questionIndex)}</span>
            <CardTitle className="text-xl">Question</CardTitle>
          </div>
          {(question.type || question.sourceAttribution) && (
            <div className="flex items-center gap-2">
              {question.type && (
                <Badge 
                  variant={question.type === 'technical' ? 'secondary' : 'default'}
                >
                  {question.type}
                </Badge>
              )}
              <SourceBadge 
                sourceAttribution={question.sourceAttribution}
                showReliability={true}
              />
            </div>
          )}
        </div>
        <CardDescription className="text-lg font-medium text-gray-800 mt-2 flex items-start gap-2">
          <span className="flex-1">{question.question}</span>
          {question.explanation && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <Info className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-sm font-medium mb-2">Why this matters:</p>
                <p className="text-sm">{question.explanation}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {question.followUp && question.followUp.length > 0 && (
          <Collapsible open={showFollowUp} onOpenChange={setShowFollowUp}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-auto p-0 text-sm text-gray-600 hover:text-gray-800 font-normal justify-start"
              >
                <span className="flex items-center gap-1">
                  + Show follow-up questions 
                  {showFollowUp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <ul className="list-disc pl-5 space-y-1">
                {question.followUp.map((followUpQ, idx) => (
                  <li key={idx} className="text-sm text-gray-600">{followUpQ}</li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default QuestionDisplay;
