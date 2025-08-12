import React from 'react';
import { Check, AlertCircle, Info } from 'lucide-react';
import { ValidationResult, getThresholdsForQuestion } from '@/utils/answerValidation';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface AnswerValidationDisplayProps {
  validation: ValidationResult;
  questionIndex: number;
  isVisible?: boolean;
}

const AnswerValidationDisplay: React.FC<AnswerValidationDisplayProps> = ({
  validation,
  questionIndex,
  isVisible = true
}) => {
  if (!isVisible) return null;

  const thresholds = getThresholdsForQuestion(questionIndex);
  
  // Calculate progress percentages
  const wordProgress = Math.min((validation.wordCount / thresholds.minWordCount) * 100, 100);
  const sentenceProgress = Math.min((validation.sentenceCount / thresholds.minSentenceCount) * 100, 100);
  const uniqueWordProgress = Math.min((validation.uniqueWordCount / thresholds.minUniqueWords) * 100, 100);
  
  // Determine progress bar color
  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  // Validation item component
  const ValidationItem = ({ 
    label, 
    current, 
    required, 
    progress,
    met 
  }: { 
    label: string; 
    current: number; 
    required: number; 
    progress: number;
    met: boolean;
  }) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5">
          {met ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-300" />
          )}
          <span className={cn(
            "font-medium",
            met ? "text-gray-700" : "text-gray-500"
          )}>
            {label}
          </span>
        </span>
        <span className={cn(
          "text-xs",
          met ? "text-green-600" : "text-gray-500"
        )}>
          {current}/{required}
        </span>
      </div>
      <Progress 
        value={progress} 
        className="h-1.5"
        indicatorClassName={getProgressColor(progress)}
      />
    </div>
  );
  
  // Overall validation status
  const getOverallStatus = () => {
    if (validation.isValid) {
      return {
        icon: <Check className="h-4 w-4" />,
        text: 'Great answer!',
        className: 'text-green-600 bg-green-50 border-green-200'
      };
    }
    
    const completionPercent = (wordProgress + sentenceProgress + uniqueWordProgress) / 3;
    
    if (completionPercent >= 70) {
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        text: 'Almost there...',
        className: 'text-yellow-600 bg-yellow-50 border-yellow-200'
      };
    }
    
    return {
      icon: <Info className="h-4 w-4" />,
      text: 'Keep writing...',
      className: 'text-blue-600 bg-blue-50 border-blue-200'
    };
  };
  
  const status = getOverallStatus();
  
  return (
    <div className="mt-3 space-y-3 animate-in fade-in-50 duration-300">
      {/* Overall Status Badge */}
      <div className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        status.className
      )}>
        {status.icon}
        {status.text}
      </div>
      
      {/* Validation Metrics */}
      <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <ValidationItem
          label="Words"
          current={validation.wordCount}
          required={thresholds.minWordCount}
          progress={wordProgress}
          met={validation.wordCount >= thresholds.minWordCount}
        />
        
        <ValidationItem
          label="Sentences"
          current={validation.sentenceCount}
          required={thresholds.minSentenceCount}
          progress={sentenceProgress}
          met={validation.sentenceCount >= thresholds.minSentenceCount}
        />
        
        <ValidationItem
          label="Unique words"
          current={validation.uniqueWordCount}
          required={thresholds.minUniqueWords}
          progress={uniqueWordProgress}
          met={validation.uniqueWordCount >= thresholds.minUniqueWords}
        />
        
        {/* Quality Warnings */}
        {validation.warnings.length > 0 && (
          <div className="pt-2 border-t border-gray-200">
            {validation.warnings.slice(0, 2).map((warning, index) => (
              <p key={index} className="flex items-start gap-1.5 text-xs text-amber-600 mt-1">
                <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                {warning}
              </p>
            ))}
          </div>
        )}
      </div>
      
      {/* Helper Text */}
      {!validation.isValid && questionIndex <= 1 && (
        <p className="text-xs text-gray-500 italic">
          💡 Include specific examples from your experience using the STAR method
        </p>
      )}
    </div>
  );
};

export default AnswerValidationDisplay;