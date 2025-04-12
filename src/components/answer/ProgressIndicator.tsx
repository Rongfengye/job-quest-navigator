
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface ProgressIndicatorProps {
  isLoading: boolean;
  progressValue: number;
  loadingText: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ 
  isLoading, 
  progressValue,
  loadingText 
}) => {
  if (!isLoading && (progressValue === 0 || progressValue === 100)) {
    return null;
  }

  return (
    <div className="mt-6">
      <p className="text-sm text-gray-500 mb-2">
        {loadingText}
      </p>
      <Progress value={progressValue} className="h-2" />
    </div>
  );
};

export default ProgressIndicator;
