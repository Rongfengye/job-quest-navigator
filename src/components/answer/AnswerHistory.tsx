
import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
                
                {/* Feedback Section - Updated to match AnswerForm styling */}
                {iteration.feedback && (
                  <Card className="mt-4 border-2 border-dashed border-green-200 bg-green-50/30">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="feedback" className="border-none">
                        <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-green-50/50">
                          <div className="flex items-center gap-3 text-left">
                            <Lightbulb className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <div>
                              <div className="font-semibold text-gray-900">Answer Feedback</div>
                              <div className="text-sm text-gray-600 mt-1">
                                Review your score and improvement suggestions
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                          <div className="border-t border-green-200 pt-6 space-y-6">
                            {/* Strengths Section with Enhanced Pill Tags */}
                            <div>
                              <h4 className="font-semibold text-md flex items-center gap-2 mb-3 text-green-700">
                                <CheckCircle className="h-4 w-4" /> 
                                Strengths
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {iteration.feedback.pros.map((pro, i) => (
                                  <Badge 
                                    key={i}
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
                                {iteration.feedback.cons.map((con, i) => (
                                  <Badge 
                                    key={i}
                                    variant="secondary" 
                                    className="bg-red-100 text-red-800 border-red-300 text-sm px-3 py-1.5 rounded-full"
                                  >
                                    {con}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            {/* Guidelines */}
                            <div>
                              <h4 className="text-sm font-semibold">Guidelines</h4>
                              <p className="text-sm text-gray-700">{iteration.feedback.guidelines}</p>
                            </div>
                            
                            {/* Improvement Suggestions */}
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                              <h4 className="font-semibold text-md mb-2 flex items-center gap-2 text-blue-800">
                                <Lightbulb className="h-4 w-4" />
                                Suggestions
                              </h4>
                              <p className="text-blue-700 text-sm leading-relaxed">{iteration.feedback.improvementSuggestions}</p>
                            </div>
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
