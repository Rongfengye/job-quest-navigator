
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, Sparkles, Mic } from 'lucide-react';
import { Question } from '@/hooks/useQuestionData';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { FeedbackData } from '@/hooks/useAnswerFeedback';
import AnswerFeedback from './AnswerFeedback';

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
              {generatingAnswer ? 'Generating...' : 'Generate Answer'}
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
        
        {/* Feedback Section */}
        {isFeedbackLoading && (
          <div className="mt-8 flex flex-col items-center justify-center py-8 border-t">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-interview-primary mb-4"></div>
            <p className="text-gray-600">Generating feedback for your answer...</p>
          </div>
        )}
        
        {feedback && !isFeedbackLoading && (
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Answer Feedback</h3>
            <AnswerFeedback 
              feedback={feedback}
              isLoading={false}
              error={feedbackError} 
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnswerForm;
