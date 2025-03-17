
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
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
      <div className="p-4 border border-red-200 rounded-md bg-red-50 mt-4">
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
      <div className="space-y-4 mt-4">
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

  // Calculate score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg">Feedback</h3>
        <Badge 
          className={`text-white text-base px-2 py-1 ${getScoreColor(feedback.score)}`}
        >
          Score: {feedback.score}/100
        </Badge>
      </div>

      {/* Strengths Section */}
      <div>
        <h4 className="font-semibold text-md flex items-center gap-2 mb-2 text-green-700">
          <CheckCircle className="h-4 w-4" /> Strengths
        </h4>
        <ul className="space-y-2 pl-6 list-disc">
          {feedback.pros.map((pro, index) => (
            <li key={`pro-${index}`} className="text-green-800">
              {pro}
            </li>
          ))}
        </ul>
      </div>

      {/* Areas for Improvement Section */}
      <div className="mt-4">
        <h4 className="font-semibold text-md flex items-center gap-2 mb-2 text-red-700">
          <XCircle className="h-4 w-4" /> Areas for Improvement
        </h4>
        <ul className="space-y-2 pl-6 list-disc">
          {feedback.cons.map((con, index) => (
            <li key={`con-${index}`} className="text-red-800">
              {con}
            </li>
          ))}
        </ul>
      </div>

      {/* Improvement Suggestions */}
      <div className="mt-4">
        <h4 className="font-semibold text-md mb-2">Suggestions</h4>
        <p className="text-gray-700">{feedback.improvementSuggestions}</p>
      </div>

      {/* Guidelines (Collapsible) */}
      <Collapsible
        open={isGuidelinesOpen}
        onOpenChange={setIsGuidelinesOpen}
        className="border rounded-md p-2 mt-4"
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="flex w-full justify-between p-2">
            Answer Guidelines
            <span className="text-xs">{isGuidelinesOpen ? "Hide" : "Show"}</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="p-2">
          <p className="text-gray-700 text-sm">{feedback.guidelines}</p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default AnswerFeedback;
