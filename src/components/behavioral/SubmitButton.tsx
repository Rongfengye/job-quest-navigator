
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface SubmitButtonProps {
  currentQuestionIndex: number;
  isSubmitting: boolean;
  isLoading: boolean;
  isNextQuestionLoading: boolean;
  onClick: () => void;
  showProcessing?: boolean;
}

const SubmitButton = ({
  currentQuestionIndex,
  isSubmitting,
  isLoading,
  isNextQuestionLoading,
  onClick,
  showProcessing = false
}: SubmitButtonProps) => {
  return (
    <div className="fixed bottom-0 right-0 w-full flex justify-end pr-8 bg-white bg-opacity-90 z-50 py-4 shadow-t">
      <Button
        onClick={onClick}
        disabled={isSubmitting || isLoading || isNextQuestionLoading || showProcessing}
        className="bg-interview-primary hover:bg-interview-dark text-white flex items-center gap-2"
      >
        {isSubmitting || isNextQuestionLoading || showProcessing ? (
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
