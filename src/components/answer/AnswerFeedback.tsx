
import React from 'react';
import { QuestionVaultFeedback } from '@/hooks/useAnswerFeedback';
import EnhancedFeedbackDisplay from '@/components/feedback/EnhancedFeedbackDisplay';
import { AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Legacy FeedbackData interface for backward compatibility
export interface FeedbackData {
  pros: string[];
  cons: string[];
  guidelines: string;
  improvementSuggestions: string;
  score: number;
}

interface AnswerFeedbackProps {
  feedback: QuestionVaultFeedback | null;
  isLoading: boolean;
  error: string | null;
}

const AnswerFeedback: React.FC<AnswerFeedbackProps> = ({ feedback, isLoading, error }) => {
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

  // Use the EnhancedFeedbackDisplay component which handles both legacy and enhanced feedback
  return <EnhancedFeedbackDisplay feedback={feedback} />;
};

export default AnswerFeedback;
