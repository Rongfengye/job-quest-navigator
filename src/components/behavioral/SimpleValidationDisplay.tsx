import React from 'react';
import { AlertCircle } from 'lucide-react';
import { ValidationResult } from '@/utils/answerValidation';

interface SimpleValidationDisplayProps {
  validation: ValidationResult;
  isVisible?: boolean;
}

const SimpleValidationDisplay: React.FC<SimpleValidationDisplayProps> = ({
  validation,
  isVisible = true
}) => {
  if (!isVisible || validation.isValid) return null;

  return (
    <div className="mt-3 space-y-3 animate-in fade-in-50 duration-300">
      {/* Quality Warnings - specific helpful messages */}
      {validation.warnings.length > 0 && (
        <div className="space-y-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
          {validation.warnings.slice(0, 3).map((warning, index) => (
            <p key={index} className="flex items-start gap-1.5 text-xs text-amber-600">
              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              {warning}
            </p>
          ))}
        </div>
      )}
      
      {/* Helper Text - STAR method guidance */}
      <p className="text-xs text-gray-500 italic">
        💡 Include specific examples from your experience using the STAR method (Situation, Task, Action, Result)
      </p>
    </div>
  );
};

export default SimpleValidationDisplay;