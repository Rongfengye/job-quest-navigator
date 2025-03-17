
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
      <Card className="mt-6 border-red-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Error Generating Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please try again or contact support if the issue persists.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>
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
    <Card className="mt-6">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">Feedback</CardTitle>
          <CardDescription>AI-generated assessment of your answer</CardDescription>
        </div>
        <Badge 
          className={`text-white text-lg px-3 py-1 ${getScoreColor(feedback.score)}`}
        >
          {feedback.score}/100
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Strengths Section */}
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2 mb-2 text-green-700">
            <CheckCircle className="h-5 w-5" /> Strengths
          </h3>
          <ul className="space-y-2 pl-6 list-disc">
            {feedback.pros.map((pro, index) => (
              <li key={`pro-${index}`} className="text-green-800">
                {pro}
              </li>
            ))}
          </ul>
        </div>

        {/* Areas for Improvement Section */}
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2 mb-2 text-red-700">
            <XCircle className="h-5 w-5" /> Areas for Improvement
          </h3>
          <ul className="space-y-2 pl-6 list-disc">
            {feedback.cons.map((con, index) => (
              <li key={`con-${index}`} className="text-red-800">
                {con}
              </li>
            ))}
          </ul>
        </div>

        {/* Improvement Suggestions */}
        <div>
          <h3 className="font-semibold text-lg mb-2">Suggestions</h3>
          <p className="text-gray-700">{feedback.improvementSuggestions}</p>
        </div>

        {/* Guidelines (Collapsible) */}
        <Collapsible
          open={isGuidelinesOpen}
          onOpenChange={setIsGuidelinesOpen}
          className="border rounded-md p-2"
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
      </CardContent>
    </Card>
  );
};

export default AnswerFeedback;
