
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, Mic } from 'lucide-react';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';

interface QuestionCardProps {
  question: string;
  currentQuestion: number;
  totalQuestions: number;
  answer: string;
  onAnswerChange: (value: string) => void;
  onNext: () => void;
}

const QuestionCard = ({
  question,
  currentQuestion,
  totalQuestions,
  answer,
  onAnswerChange,
  onNext
}: QuestionCardProps) => {
  const { isRecording, startRecording, stopRecording } = useVoiceRecording((text) => {
    onAnswerChange(answer + (answer ? ' ' : '') + text);
  });

  const handleMicClick = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Question {currentQuestion + 1}/{totalQuestions}</span>
        </div>
        <h2 className="text-2xl font-semibold">{question}</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Textarea
            placeholder="Type your answer here..."
            className="min-h-[200px] pr-12"
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value)}
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
        <div className="flex justify-end">
          <Button 
            onClick={onNext}
            className="flex items-center gap-2"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionCard;
