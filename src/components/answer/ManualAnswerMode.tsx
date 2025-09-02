
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Save, Mic, PenTool, Sparkles, AlertCircle, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { QuestionVaultFeedback } from '@/hooks/useAnswerFeedback';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { AnswerMode } from './AnswerModeToggle';

interface ManualAnswerModeProps {
  inputAnswer: string;
  setInputAnswer: (value: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isSaving: boolean;
  feedback: QuestionVaultFeedback | null;
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
  const [showPulse, setShowPulse] = useState(false);
  
  // Show pulse animation for 3 seconds when component mounts (when switching to manual mode)
  useEffect(() => {
    setShowPulse(true);
    const timer = setTimeout(() => {
      setShowPulse(false);
    }, 4500);
    
    return () => clearTimeout(timer);
  }, []); // Empty dependency array means this runs once on mount
  
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
          <div className="flex items-center gap-3">
            <PenTool className="w-5 h-5 text-gray-600" />
            <div>
              <CardTitle className="text-xl">Your Answer</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Write your response directly in the text area below
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Badge Strip */}
            <div className="flex items-center gap-2">
              {feedback && (
                <Badge 
                  variant="secondary" 
                  className="bg-blue-100 text-blue-800 border-blue-300 text-xs"
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
            
            {/* More Options Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onModeChange('guided')}
                  className={`cursor-pointer ${
                    showPulse ? 'animate-pulse-color-blue' : ''
                  }`}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Get AI Help
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Compact Draft Warning */}
        {hasUnsavedDraft && (
          <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md mb-3 text-xs">
            <AlertCircle className="w-3 h-3 text-yellow-600 flex-shrink-0" />
            <span className="text-yellow-800">
              Unsaved changes - click Save to preserve
            </span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Textarea 
              value={inputAnswer}
              onChange={(e) => setInputAnswer(e.target.value)}
              placeholder="Type your response here..."
              className="min-h-[250px] resize-y pr-20"
            />
            <div className="absolute right-2 top-2 flex items-center gap-1">
              <Button 
                type="button" 
                size="icon" 
                variant={isRecording ? "default" : "ghost"}
                className="opacity-70 hover:opacity-100 w-8 h-8"
                onClick={handleMicClick}
              >
                <Mic className={`h-4 w-4 ${isRecording ? 'text-white animate-pulse' : ''}`} />
              </Button>
              
              {/* Floating Save Button */}
              <Button 
                type="submit" 
                disabled={isSaving || !isAnswerValid}
                size="sm"
                className="flex items-center gap-1 px-3 py-1 h-8 text-xs font-medium"
              >
                <Save className="w-3 h-3" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ManualAnswerMode;
