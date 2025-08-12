
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { ValidationResult } from '@/utils/answerValidation';
import { cn } from '@/lib/utils';

interface SubmitButtonProps {
  currentQuestionIndex: number;
  isSubmitting: boolean;
  isLoading: boolean;
  isNextQuestionLoading: boolean;
  onClick: () => void;
  showProcessing?: boolean;
  validation?: ValidationResult | null;
  answerLength?: number;
}

const SubmitButton = ({
  currentQuestionIndex,
  isSubmitting,
  isLoading,
  isNextQuestionLoading,
  onClick,
  showProcessing = false,
  validation,
  answerLength = 0
}: SubmitButtonProps) => {
  // Determine button state based on validation (Phase 5)
  const getButtonState = () => {
    if (!answerLength || answerLength === 0) {
      return { disabled: true, variant: 'default', showWarning: false };
    }
    
    if (!validation) {
      return { disabled: false, variant: 'default', showWarning: false };
    }
    
    // For extreme cases (all questions), show warning state
    const isExtreme = validation.wordCount < 20 || 
                     validation.metrics.repetitionScore > 0.5;
    
    if (isExtreme && !validation.isValid) {
      return { disabled: false, variant: 'warning', showWarning: true };
    }
    
    // For regular validation failures (all questions), just show visual feedback
    if (!validation.isValid) {
      return { disabled: false, variant: 'caution', showWarning: false };
    }
    
    return { disabled: false, variant: 'success', showWarning: false };
  };
  
  const buttonState = getButtonState();
  const isProcessing = isSubmitting || isNextQuestionLoading || showProcessing;
  
  // Determine button color based on state
  const getButtonClassName = () => {
    if (isProcessing) return "bg-gray-400";
    
    switch (buttonState.variant) {
      case 'warning':
        return "bg-orange-500 hover:bg-orange-600";
      case 'caution':
        return "bg-interview-primary hover:bg-interview-dark opacity-90";
      case 'success':
        return "bg-green-600 hover:bg-green-700";
      default:
        return "bg-interview-primary hover:bg-interview-dark";
    }
  };
  
  return (
    <div className="fixed bottom-0 left-0 w-full z-50 pointer-events-none">
      <div className="max-w-4xl mx-auto flex flex-col items-end pr-6 py-4 bg-white bg-opacity-90 shadow-t pointer-events-auto">
        {/* Warning message for extreme cases (all questions) */}
        {buttonState.showWarning && validation && !validation.isValid && (
          <p className="text-sm text-orange-600 mb-2 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            Your answer needs more detail. Submit anyway?
          </p>
        )}
        
        <Button
          onClick={onClick}
          disabled={buttonState.disabled || isLoading}
          className={cn(
            "text-white flex items-center gap-2 transition-all",
            getButtonClassName()
          )}
        >
          {isProcessing ? (
            <>Processing...</>
          ) : currentQuestionIndex < 4 ? (
            <>
              {buttonState.variant === 'success' ? 'Submit Answer & Continue' : 'Next Question'} 
              <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            <>
              {buttonState.variant === 'success' ? 'Submit Answer & Complete Interview' : 'Finish Interview'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SubmitButton;
