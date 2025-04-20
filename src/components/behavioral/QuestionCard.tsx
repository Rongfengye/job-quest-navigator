
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight } from 'lucide-react';

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
  return (
    <Card className="w-full max-w-3xl">
      <CardHeader className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Question {currentQuestion + 1}/{totalQuestions}</span>
        </div>
        <h2 className="text-2xl font-semibold">{question}</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Type your answer here..."
          className="min-h-[200px]"
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value)}
        />
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
