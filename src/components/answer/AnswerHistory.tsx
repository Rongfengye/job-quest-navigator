
import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { FeedbackData } from '@/hooks/useAnswerFeedback';

interface AnswerIteration {
  text: string;
  timestamp: string;
  feedback?: FeedbackData;
}

interface AnswerHistoryProps {
  iterations: AnswerIteration[];
  setInputAnswer: (text: string) => void;
  setActiveTab: (tab: string) => void;
}

const AnswerHistory: React.FC<AnswerHistoryProps> = ({
  iterations,
  setInputAnswer,
  setActiveTab
}) => {
  // Log iterations when they change to track updates
  useEffect(() => {
    console.log('AnswerHistory: iterations updated', iterations);
  }, [iterations]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Answer History</CardTitle>
        <CardDescription>
          Review your previous iterations to see how your answer has evolved.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {iterations.length === 0 ? (
          <p className="text-gray-500 italic">No previous iterations found.</p>
        ) : (
          <div className="space-y-6">
            {[...iterations].reverse().map((iteration, idx) => (
              <div key={`iteration-${idx}-${iteration.timestamp}`} className="border rounded-md p-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-gray-500">
                    Iteration {iterations.length - idx}
                  </p>
                  <p className="text-xs text-gray-400">
                    {format(new Date(iteration.timestamp), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{iteration.text}</p>
                
                {iteration.feedback && (
                  <div className="mt-3 flex justify-between items-center">
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 text-blue-500 mr-1" />
                      <span className="text-sm text-blue-600">
                        Feedback score: {iteration.feedback.score}/10
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="mt-3 flex justify-end gap-2">
                  {iteration.feedback && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setInputAnswer(iteration.text);
                        setActiveTab('feedback');
                      }}
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      View feedback
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setInputAnswer(iteration.text);
                      setActiveTab('current');
                    }}
                  >
                    Use this answer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnswerHistory;
