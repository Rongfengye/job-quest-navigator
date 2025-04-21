
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface SubmitButtonProps {
  currentQuestionIndex: number;
  isSubmitting: boolean;
  isLoading: boolean;
  isNextQuestionLoading: boolean;
  onClick: () => void;
}

const SubmitButton = ({
  currentQuestionIndex,
  isSubmitting,
  isLoading,
  isNextQuestionLoading,
  onClick
}: SubmitButtonProps) => {
  return (
    <div className="flex justify-end">
      <Button
        onClick={onClick}
        disabled={isSubmitting || isLoading || isNextQuestionLoading}
        className="bg-interview-primary hover:bg-interview-dark text-white flex items-center gap-2"
      >
        {isSubmitting || isNextQuestionLoading ? (
          <>Processing...</>
        ) : currentQuestionIndex < 4 ? (
          <>Next Question <ArrowRight className="w-4 h-4" /></>
        ) : (
          <>Finish Interview</>
        )}
      </Button>
    </div>
  );
};

export default SubmitButton;
