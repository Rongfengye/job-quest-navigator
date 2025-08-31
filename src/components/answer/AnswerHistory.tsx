
import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AnswerIteration } from '@/hooks/useAnswers';
import EnhancedFeedbackDisplay from '@/components/feedback/EnhancedFeedbackDisplay';
import { isEnhancedFeedback } from '@/types/enhancedFeedback';

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

  // Calculate score color for feedback
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (score >= 60) return 'bg-yellow-50 text-yellow-700 border-yellow-100';
    return 'bg-orange-50 text-orange-700 border-orange-100';
  };

  // Get score from feedback object
  const getScore = (feedback: any): number => {
    if (isEnhancedFeedback(feedback)) {
      return Number(feedback.overall) || 50;
    } else {
      return Number(feedback.score) || 50;
    }
  };

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
                    <div className="flex items-center gap-2">
                     {iteration.feedback && (
                       <Badge 
                         className={`text-xs px-2 py-1 ${getScoreColor(getScore(iteration.feedback))}`}
                       >
                         {getScore(iteration.feedback)}/100
                       </Badge>
                     )}
                    <p className="text-xs text-gray-400">
                      {format(new Date(iteration.timestamp), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
                
                {/* Answer Text */}
                <p className="text-gray-700 whitespace-pre-wrap">{iteration.answerText}</p>
                
                {/* Feedback Section - Updated to match AnswerForm styling */}
                {iteration.feedback && (
                  <Card className="mt-4 border-0 bg-gray-50 rounded-xl shadow-sm">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="feedback" className="border-none">
                        <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-100">
                          <div className="flex items-center gap-3 text-left">
                            <Lightbulb className="w-5 h-5 text-gray-500 flex-shrink-0" />
                            <div>
                              <div className="font-semibold text-gray-900">Answer Feedback</div>
                              <div className="text-sm text-gray-600 mt-1">
                                Review your score and improvement suggestions
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                          <div className="border-t border-gray-200 pt-6">
                            {/* Use Enhanced Feedback Display */}
                            <EnhancedFeedbackDisplay feedback={iteration.feedback} />
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </Card>
                )}
                
                <div className="mt-3 flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setInputAnswer(iteration.answerText);
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
