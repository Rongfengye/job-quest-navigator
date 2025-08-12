
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
    <div className="fixed bottom-0 left-0 w-full z-50 pointer-events-none">
      <div className="max-w-4xl mx-auto flex justify-end pr-6 py-4 bg-white bg-opacity-90 shadow-t pointer-events-auto">
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
    </div>
  );
};

export default SubmitButton;
