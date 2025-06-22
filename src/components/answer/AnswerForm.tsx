import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Save, Sparkles, Mic, HelpCircle, Lightbulb } from 'lucide-react';
import { Question } from '@/hooks/useQuestionData';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { FeedbackData } from '@/hooks/useAnswerFeedback';
import AnswerFeedback from './AnswerFeedback';
import ProgressIndicator from './ProgressIndicator';

interface AnswerFormProps {
  inputAnswer: string;
  setInputAnswer: (value: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  handleGenerateAnswer: () => void;
  isSaving: boolean;
  generatingAnswer: boolean;
  question: Question | null;
  feedback: FeedbackData | null;
  isFeedbackLoading: boolean;
  feedbackError: string | null;
  processingThoughts: boolean;
}

const AnswerForm: React.FC<AnswerFormProps> = ({
  inputAnswer,
  setInputAnswer,
  handleSubmit,
  handleGenerateAnswer,
  isSaving,
  generatingAnswer,
  question,
  feedback,
  isFeedbackLoading,
  feedbackError,
  processingThoughts
}) => {
  const { isRecording, startRecording, stopRecording } = useVoiceRecording((text) => {
    setInputAnswer(inputAnswer + (inputAnswer ? ' ' : '') + text);
  });

  const [progressValue, setProgressValue] = useState(0);
  const [guidingQuestions, setGuidingQuestions] = useState<string[] | null>(null);
  const [thoughts, setThoughts] = useState('');

  // Simulate progress when feedback is loading or when generating answer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isFeedbackLoading || generatingAnswer || processingThoughts) {
      setProgressValue(0);
      
      interval = setInterval(() => {
        setProgressValue(prev => {
          if (prev < 90) {
            return prev + (90 - prev) * 0.1;
          }
          return prev;
        });
      }, 300);
    } else if (feedback || guidingQuestions) {
      setProgressValue(100);
      
      const timeout = setTimeout(() => {
        setProgressValue(0);
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isFeedbackLoading, feedback, generatingAnswer, guidingQuestions, processingThoughts]);

  // Update guidingQuestions based on a custom event
  useEffect(() => {
    const handleGuidanceReceived = (event: CustomEvent) => {
      setGuidingQuestions(event.detail.guidingQuestions);
    };

    window.addEventListener('guidanceReceived' as any, handleGuidanceReceived);
    
    return () => {
      window.removeEventListener('guidanceReceived' as any, handleGuidanceReceived);
    };
  }, []);

  // Listen for response received event to clear thoughts
  useEffect(() => {
    const handleResponseReceived = () => {
      setThoughts('');
    };

    window.addEventListener('responseReceived' as any, handleResponseReceived);
    
    return () => {
      window.removeEventListener('responseReceived' as any, handleResponseReceived);
    };
  }, []);

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSubmitThoughts = async () => {
    if (!thoughts.trim() || processingThoughts) return;
    
    const thoughtsEvent = new CustomEvent('thoughtsSubmitted', {
      detail: { thoughts }
    });
    window.dispatchEvent(thoughtsEvent);
    
    setThoughts('');
  };

  const isAnswerValid = inputAnswer.trim().length > 0;
  const loadingText = processingThoughts 
    ? 'Transforming your thoughts into a response...'
    : generatingAnswer 
      ? 'Generating guiding questions...' 
      : isFeedbackLoading 
        ? 'Generating feedback...' 
        : 'Completing...';

  return (
    <div className="space-y-6">
      {/* Main Answer Card */}
      <Card className="border-2 border-dashed border-gray-200">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">Your Answer</CardTitle>
              <CardDescription className="mt-1">
                Step 1 of 2: Type your answer or use guided help below
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {feedback && (
                <Badge 
                  variant="secondary" 
                  className="bg-blue-100 text-blue-800 border-blue-300"
                >
                  Score: {feedback.score}/100
                </Badge>
              )}
              {feedback && (
                <Badge variant="outline" className="text-xs">
                  Iteration {feedback ? '2' : '1'}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Textarea 
                value={inputAnswer}
                onChange={(e) => setInputAnswer(e.target.value)}
                placeholder="Type your response here..."
                className="min-h-[200px] resize-y pr-10"
              />
              <Button 
                type="button" 
                size="icon" 
                variant={isRecording ? "default" : "ghost"}
                className="absolute right-2 top-2 opacity-70 hover:opacity-100"
                onClick={handleMicClick}
              >
                <Mic className={`h-4 w-4 ${isRecording ? 'text-white animate-pulse' : ''}`} />
              </Button>
            </div>
            
            <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGenerateAnswer}
                      disabled={generatingAnswer}
                      className="flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      {generatingAnswer ? 'Generating...' : 'Get Guided Help'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Need help? Click to explore guiding questions and build your response step by step.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Button 
                type="submit" 
                disabled={isSaving || !isAnswerValid}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Answer'}
              </Button>
            </div>
          </form>
          
          <ProgressIndicator 
            isLoading={isFeedbackLoading || generatingAnswer || processingThoughts} 
            progressValue={progressValue}
            loadingText={loadingText}
          />
        </CardContent>
      </Card>

      {/* Feedback Section - Collapsible Accordion */}
      {(isFeedbackLoading || feedback) && (
        <Card className="border-2 border-dashed border-green-200 bg-green-50/30">
          <Accordion type="single" collapsible className="w-full" defaultValue="feedback">
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
                <div className="border-t border-green-200 pt-6">
                  <AnswerFeedback 
                    feedback={feedback}
                    isLoading={isFeedbackLoading}
                    error={feedbackError} 
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      )}

      {/* Guided Response Tool - Improved Accordion Style */}
      <Card className="border-2 border-dashed border-blue-200 bg-blue-50/30">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="guided-tool" className="border-none">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-blue-50/50">
              <div className="flex items-center gap-3 text-left">
                <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-gray-900">Guided Response Tool</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Get help brainstorming and structuring your response
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-6 border-t border-blue-200 pt-6">
                {/* Guiding Questions */}
                {guidingQuestions && guidingQuestions.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-blue-600" />
                      Guiding Questions
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Consider these questions to help structure and improve your answer:
                    </p>
                    <ul className="space-y-2">
                      {guidingQuestions.map((question, index) => (
                        <li key={`question-${index}`} className="flex gap-2">
                          <span className="font-medium text-blue-600 flex-shrink-0">{index + 1}.</span>
                          <span className="text-gray-800 text-sm">{question}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Unified Thoughts Input */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold mb-2">Build Your Response</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Jot your thoughts here and I'll shape them into a structured answer.
                  </p>
                  
                  <Textarea
                    value={thoughts}
                    onChange={(e) => setThoughts(e.target.value)}
                    placeholder="Type your thoughts about these questions here..."
                    className="min-h-[120px] resize-y mb-4"
                  />
                  
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSubmitThoughts}
                      disabled={!thoughts.trim() || processingThoughts || generatingAnswer}
                      className="flex items-center gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      {processingThoughts ? 'Processing...' : 'Generate Structured Response'}
                    </Button>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    </div>
  );
};

export default AnswerForm;
