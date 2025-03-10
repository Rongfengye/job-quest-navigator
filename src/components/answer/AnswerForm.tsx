
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, Sparkles } from 'lucide-react';
import { Question } from '@/hooks/useQuestionData';
import AudioRecorder from './AudioRecorder';
import { useUserTokens } from '@/hooks/useUserTokens';

interface AnswerFormProps {
  inputAnswer: string;
  setInputAnswer: (value: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  handleGenerateAnswer: () => void;
  isSaving: boolean;
  generatingAnswer: boolean;
  question: Question | null;
  questionId?: string;
}

const AnswerForm: React.FC<AnswerFormProps> = ({
  inputAnswer,
  setInputAnswer,
  handleSubmit,
  handleGenerateAnswer,
  isSaving,
  generatingAnswer,
  question,
  questionId
}) => {
  const { tokens } = useUserTokens();
  
  const handleTranscriptionComplete = (text: string) => {
    setInputAnswer(prev => prev ? `${prev}\n\n${text}` : text);
  };

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
              className="min-h-[200px] resize-y"
            />
          </div>
          
          <div className="flex flex-wrap items-center justify-between pt-2 gap-2">
            <div className="flex items-center gap-2">
              <AudioRecorder 
                onTranscriptionComplete={handleTranscriptionComplete} 
                questionId={questionId}
              />
              
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateAnswer}
                disabled={generatingAnswer || (tokens !== null && tokens < 1)}
                className="flex items-center gap-2"
                title={tokens !== null && tokens < 1 ? "Insufficient tokens" : "Generate a sample answer"}
              >
                <Sparkles className="w-4 h-4" />
                {generatingAnswer ? 'Generating...' : 'Generate Answer'}
              </Button>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSaving || inputAnswer.trim() === ''}
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

export default AnswerForm;
