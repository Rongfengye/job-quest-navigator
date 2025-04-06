
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, Sparkles, Mic, HelpCircle } from 'lucide-react';
import { Question } from '@/hooks/useQuestionData';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { FeedbackData } from '@/hooks/useAnswerFeedback';
import AnswerFeedback from './AnswerFeedback';
import { Progress } from '@/components/ui/progress';

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
  feedbackError
}) => {
  const { isRecording, startRecording, stopRecording } = useVoiceRecording((text) => {
    // Fix: directly concat the strings instead of using a function with prev
    setInputAnswer(inputAnswer + (inputAnswer ? ' ' : '') + text);
  });

  const [progressValue, setProgressValue] = useState(0);
  const [guidingQuestions, setGuidingQuestions] = useState<string[] | null>(null);

  // Simulate progress when feedback is loading or when generating answer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isFeedbackLoading || generatingAnswer) {
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
  }, [isFeedbackLoading, feedback, generatingAnswer, guidingQuestions]);

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

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const isAnswerValid = inputAnswer.trim().length > 0;

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Your Answer</CardTitle>
        </div>
        <CardDescription>
          Practice your response to this question below.
        </CardDescription>
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
        
        {/* Loading Progress Bar */}
        {(isFeedbackLoading || generatingAnswer || (progressValue > 0 && progressValue < 100)) && (
          <div className="mt-6">
            <p className="text-sm text-gray-500 mb-2">
              {generatingAnswer ? 'Generating guiding questions...' : isFeedbackLoading ? 'Generating feedback...' : 'Completing...'}
            </p>
            <Progress value={progressValue} className="h-2" />
          </div>
        )}
        
        {/* Guiding Questions Section */}
        {guidingQuestions && guidingQuestions.length > 0 && (
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-500" />
              Guiding Questions
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Consider these questions to help structure and improve your answer:
            </p>
            <ul className="space-y-3 pl-2">
              {guidingQuestions.map((question, index) => (
                <li key={`question-${index}`} className="flex gap-2">
                  <span className="font-medium text-blue-600">{index + 1}.</span>
                  <span className="text-gray-800">{question}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Feedback Section */}
        {(isFeedbackLoading || feedback) && (
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Answer Feedback</h3>
            <AnswerFeedback 
              feedback={feedback}
              isLoading={isFeedbackLoading}
              error={feedbackError} 
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnswerForm;
