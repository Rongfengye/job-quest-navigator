
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Save, Mic, PenTool, Sparkles } from 'lucide-react';
import { FeedbackData } from '@/hooks/useAnswerFeedback';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { AnswerMode } from './AnswerModeToggle';

interface ManualAnswerModeProps {
  inputAnswer: string;
  setInputAnswer: (value: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isSaving: boolean;
  feedback: FeedbackData | null;
  hasUnsavedDraft: boolean;
  onModeChange: (mode: AnswerMode) => void;
  currentMode: AnswerMode;
}

const ManualAnswerMode: React.FC<ManualAnswerModeProps> = ({
  inputAnswer,
  setInputAnswer,
  handleSubmit,
  isSaving,
  feedback,
  hasUnsavedDraft,
  onModeChange,
  currentMode
}) => {
  const { isRecording, startRecording, stopRecording } = useVoiceRecording((text) => {
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
    <Card className="border-2 border-gray-200">
      <CardHeader className="border-b bg-gray-50/50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-gray-600" />
            <div>
              <CardTitle className="text-xl">Your Answer</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Write your response directly in the text area below
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Small mode toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onModeChange('guided')}
              className="text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Switch to Guided
            </Button>
            
            <Badge variant="outline" className="text-xs text-gray-700 border-gray-300">
              <PenTool className="w-3 h-3 mr-1" />
              Manual Mode Active
            </Badge>
            
            {feedback && (
              <Badge 
                variant="secondary" 
                className="bg-blue-100 text-blue-800 border-blue-300"
              >
                Score: {feedback.score}/100
              </Badge>
            )}
            {hasUnsavedDraft && (
              <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-300">
                Draft
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
              className="min-h-[250px] resize-y pr-10"
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
          
          <div className="flex justify-end pt-2">
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
      </CardContent>
    </Card>
  );
};

export default ManualAnswerMode;
