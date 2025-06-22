
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export interface FeedbackData {
  pros: string[];
  cons: string[];
  guidelines: string;
  improvementSuggestions: string;
  score: number;
}

interface AnswerFeedbackProps {
  feedback: FeedbackData | null;
  isLoading: boolean;
  error: string | null;
}

const AnswerFeedback: React.FC<AnswerFeedbackProps> = ({ feedback, isLoading, error }) => {
  const [isGuidelinesOpen, setIsGuidelinesOpen] = React.useState(false);

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-md bg-red-50">
        <div className="flex items-center gap-2 text-red-600 font-medium mb-2">
          <AlertTriangle className="h-5 w-5" />
          Error Generating Feedback
        </div>
        <p className="text-red-600">{error}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Please try again or contact support if the issue persists.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }

  if (!feedback) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Strengths Section with Enhanced Pill Tags */}
      <div>
        <h4 className="font-semibold text-md flex items-center gap-2 mb-3 text-green-700">
          <CheckCircle className="h-4 w-4" /> 
          Strengths
        </h4>
        <div className="flex flex-wrap gap-2">
          {feedback.pros.map((pro, index) => (
            <Badge 
              key={`pro-${index}`} 
              variant="secondary" 
              className="bg-green-100 text-green-800 border-green-300 text-sm px-3 py-1.5 rounded-full"
            >
              {pro}
            </Badge>
          ))}
        </div>
      </div>

      {/* Areas for Improvement Section with Enhanced Pill Tags */}
      <div>
        <h4 className="font-semibold text-md flex items-center gap-2 mb-3 text-red-700">
          <XCircle className="h-4 w-4" /> 
          Areas for Improvement
        </h4>
        <div className="flex flex-wrap gap-2">
          {feedback.cons.map((con, index) => (
            <Badge 
              key={`con-${index}`} 
              variant="secondary" 
              className="bg-red-100 text-red-800 border-red-300 text-sm px-3 py-1.5 rounded-full"
            >
              {con}
            </Badge>
          ))}
        </div>
      </div>

      {/* Improvement Suggestions */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-md mb-2 flex items-center gap-2 text-blue-800">
          <Lightbulb className="h-4 w-4" />
          Suggestions
        </h4>
        <p className="text-blue-700 text-sm leading-relaxed">{feedback.improvementSuggestions}</p>
      </div>

      {/* Guidelines (Collapsible) */}
      <Collapsible
        open={isGuidelinesOpen}
        onOpenChange={setIsGuidelinesOpen}
        className="border border-gray-200 rounded-lg"
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="flex w-full justify-between p-3 hover:bg-gray-50 rounded-lg">
            <span className="font-medium">Answer Guidelines</span>
            <span className="text-xs text-gray-500">{isGuidelinesOpen ? "Hide" : "Show"}</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="p-3 border-t bg-gray-50 rounded-b-lg">
          <p className="text-gray-700 text-sm leading-relaxed">{feedback.guidelines}</p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default AnswerFeedback;
