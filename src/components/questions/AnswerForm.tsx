
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Sparkles } from 'lucide-react';

interface AnswerFormProps {
  inputAnswer: string;
  setInputAnswer: (value: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  handleGenerateAnswer: () => Promise<void>;
  generatingAnswer: boolean;
  isSaving: boolean;
}

const AnswerForm: React.FC<AnswerFormProps> = ({
  inputAnswer,
  setInputAnswer,
  handleSubmit,
  handleGenerateAnswer,
  generatingAnswer,
  isSaving
}) => {
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Your Answer</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">Submissions</span>
          </div>
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
              variant="ghost" 
              className="absolute right-2 top-2 opacity-70 hover:opacity-100"
            >
              <Mic className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between pt-2">
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
              disabled={isSaving || inputAnswer.trim() === ''}
              className="flex items-center gap-2"
            >
              {isSaving ? 'Saving...' : 'Submit'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AnswerForm;
