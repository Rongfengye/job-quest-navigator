
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Volume2 } from 'lucide-react';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

interface QuestionContentProps {
  currentQuestionIndex: number;
  currentQuestion: { question: string } | null;
  answer: string;
  setAnswer: (value: string) => void;
  isRecording: boolean;
  toggleRecording: () => void;
}

const QuestionContent = ({
  currentQuestionIndex,
  currentQuestion,
  answer,
  setAnswer,
  isRecording,
  toggleRecording
}: QuestionContentProps) => {
  const { speakText, isPlaying } = useTextToSpeech();

  useEffect(() => {
    if (currentQuestion?.question) {
      speakText(currentQuestion.question);
    }
  }, [currentQuestion?.question]);

  return (
    <>
      <div className="mb-4">
        <div className="text-sm text-gray-500 mb-2">
          Question {currentQuestionIndex + 1} of 5
        </div>
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl md:text-2xl font-semibold text-interview-primary flex-1">
            {currentQuestion?.question || 'Loading question...'}
          </h2>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => currentQuestion?.question && speakText(currentQuestion.question)}
            disabled={isPlaying}
            className="mt-1"
          >
            <Volume2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="mt-6 flex-1">
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="answer" className="block text-sm font-medium text-gray-700">
            Your Answer
          </label>
          
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              size="sm"
              variant={isRecording ? "destructive" : "outline"}
              onClick={toggleRecording}
              className="flex items-center gap-1"
            >
              <Mic className="h-4 w-4" />
              {isRecording ? 'Stop' : 'Record'}
            </Button>
          </div>
        </div>
        
        <Textarea
          id="answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="min-h-[200px]"
          placeholder="Type your answer here..."
        />
      </div>
    </>
  );
};

export default QuestionContent;
