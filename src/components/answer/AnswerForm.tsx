import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Save, Sparkles, Mic, ChevronDown, ChevronRight, HelpCircle, Lightbulb } from 'lucide-react';
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
  const [isGuidedToolOpen, setIsGuidedToolOpen] = useState(false);
  const [thoughts, setThoughts] = useState('');

  // Simulate progress when feedback is loading or when generating answer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isFeedbackLoading || generatingAnswer || processingThoughts) {
      setProgressValue(0);
      
      interval = setInterval(() => {
        setProgressValue(prev => {
          // Increase progress but never reach 100% until loading is complete
          if (prev < 90) {
            return prev + (90 - prev) * 0.1;
          }
          return prev;
        });
      }, 300);
    } else if (feedback || guidingQuestions) {
      // When loading is complete, jump to 100%
      setProgressValue(100);
      
      // Reset progress after a delay
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
      setIsGuidedToolOpen(true); // Auto-open when questions are received
    };

    window.addEventListener('guidanceReceived' as any, handleGuidanceReceived);
    
    return () => {
      window.removeEventListener('guidanceReceived' as any, handleGuidanceReceived);
    };
  }, []);

  // Listen for response received event to close guided tool
  useEffect(() => {
    const handleResponseReceived = () => {
      setIsGuidedToolOpen(false);
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
    
    // Dispatch custom event to notify useGuidedResponse hook
    const thoughtsEvent = new CustomEvent('thoughtsSubmitted', {
      detail: { thoughts }
    });
    window.dispatchEvent(thoughtsEvent);
    
    // Clear the thoughts input after submission
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
      {/* Feedback Section - Moved to top as recommended */}
      {(isFeedbackLoading || feedback) && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-blue-500" />
                Answer Feedback
              </CardTitle>
              {feedback && (
                <Badge 
                  variant="secondary" 
                  className="bg-blue-100 text-blue-800 border-blue-300"
                >
                  Score: {feedback.score}/100
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <AnswerFeedback 
              feedback={feedback}
              isLoading={isFeedbackLoading}
              error={feedbackError} 
            />
          </CardContent>
        </Card>
      )}

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
            {feedback && (
              <Badge variant="outline" className="text-xs">
                Iteration {feedback ? '2' : '1'}
              </Badge>
            )}
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
                      {generatingAnswer ? 'Generating...' : 'Guided Response Tool'}
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

      {/* Guided Response Tool - Accordion Style */}
      <Collapsible 
        open={isGuidedToolOpen} 
        onOpenChange={setIsGuidedToolOpen}
        className="border-2 border-dashed border-gray-200 rounded-lg"
      >
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-between p-4 hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <ChevronRight className={`w-4 h-4 transition-transform ${isGuidedToolOpen ? 'rotate-90' : ''}`} />
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="font-medium">Guided Response Tool</span>
            </div>
            <span className="text-sm text-gray-500">Get help brainstorming and structuring your response</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4">
          <div className="space-y-4">
            {/* Guiding Questions */}
            {guidingQuestions && guidingQuestions.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-md">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-500" />
                  Guiding Questions
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Consider these questions to help structure and improve your answer:
                </p>
                <ul className="space-y-2">
                  {guidingQuestions.map((question, index) => (
                    <li key={`question-${index}`} className="flex gap-2">
                      <span className="font-medium text-blue-600">{index + 1}.</span>
                      <span className="text-gray-800 text-sm">{question}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Thoughts Input - Merged with guiding questions */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Your Thoughts</h3>
              <p className="text-sm text-gray-600">
                Jot your thoughts here and I'll shape them into an answer.
              </p>
              
              <Textarea
                value={thoughts}
                onChange={(e) => setThoughts(e.target.value)}
                placeholder="Type your thoughts about these questions here..."
                className="min-h-[120px] resize-y"
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
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default AnswerForm;
