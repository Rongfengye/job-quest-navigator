
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, Sparkles, Mic, MessageSquare } from 'lucide-react';
import { Question } from '@/hooks/useQuestionData';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';

interface AnswerFormProps {
  inputAnswer: string;
  setInputAnswer: (value: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  handleGenerateAnswer: () => void;
  isSaving: boolean;
  generatingAnswer: boolean;
  question: Question | null;
  onGetFeedback?: () => void;
  showFeedbackButton?: boolean;
}

const AnswerForm: React.FC<AnswerFormProps> = ({
  inputAnswer,
  setInputAnswer,
  handleSubmit,
  handleGenerateAnswer,
  isSaving,
  generatingAnswer,
  question,
  onGetFeedback,
  showFeedbackButton = false
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

  const answerLength = inputAnswer.trim().length;
  const isAnswerValid = answerLength > 0;
  const isAnswerLongEnough = answerLength >= 30;

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
            <div className="flex items-center gap-2">
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
              
              {showFeedbackButton && onGetFeedback && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onGetFeedback}
                  disabled={!isAnswerLongEnough || isSaving}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Get Feedback
                </Button>
              )}
            </div>
            
            <Button 
              type="submit" 
              disabled={isSaving || !isAnswerValid}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Answer'}
            </Button>
          </div>
          
          {!isAnswerLongEnough && answerLength > 0 && (
            <p className="text-amber-600 text-sm">Your answer is too short for meaningful feedback. Please elaborate (minimum 30 characters).</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default AnswerForm;
