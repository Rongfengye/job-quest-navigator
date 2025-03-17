
import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AnswerIteration } from '@/hooks/useAnswers';

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
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
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
                        className={`text-white text-xs px-2 py-1 ${getScoreColor(iteration.feedback.score)}`}
                      >
                        Score: {iteration.feedback.score}/100
                      </Badge>
                    )}
                    <p className="text-xs text-gray-400">
                      {format(new Date(iteration.timestamp), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
                
                {/* Answer Text */}
                <p className="text-gray-700 whitespace-pre-wrap">{iteration.answerText}</p>
                
                {/* Feedback Section (if available) */}
                {iteration.feedback && (
                  <Collapsible className="mt-4 border border-gray-100 rounded-md">
                    <CollapsibleTrigger className="w-full p-2 text-left text-sm font-medium flex justify-between items-center">
                      <span>View Feedback</span>
                      <span className="text-xs text-gray-400">Click to expand</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-4">
                      <div className="space-y-3">
                        {/* Strengths */}
                        <div>
                          <h4 className="text-sm font-semibold flex items-center gap-1 text-green-700">
                            <CheckCircle className="h-4 w-4" /> Strengths
                          </h4>
                          <ul className="text-sm pl-6 list-disc">
                            {iteration.feedback.pros.map((pro, i) => (
                              <li key={i} className="text-green-800">{pro}</li>
                            ))}
                          </ul>
                        </div>
                        
                        {/* Areas for Improvement */}
                        <div>
                          <h4 className="text-sm font-semibold flex items-center gap-1 text-red-700">
                            <XCircle className="h-4 w-4" /> Areas for Improvement
                          </h4>
                          <ul className="text-sm pl-6 list-disc">
                            {iteration.feedback.cons.map((con, i) => (
                              <li key={i} className="text-red-800">{con}</li>
                            ))}
                          </ul>
                        </div>
                        
                        {/* Guidelines */}
                        <div>
                          <h4 className="text-sm font-semibold">Guidelines</h4>
                          <p className="text-sm text-gray-700">{iteration.feedback.guidelines}</p>
                        </div>
                        
                        {/* Improvement Suggestions */}
                        <div>
                          <h4 className="text-sm font-semibold">Suggestions</h4>
                          <p className="text-sm text-gray-700">{iteration.feedback.improvementSuggestions}</p>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
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
