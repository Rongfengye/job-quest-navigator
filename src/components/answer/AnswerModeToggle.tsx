
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PenTool, Sparkles } from 'lucide-react';

export type AnswerMode = 'manual' | 'guided';

interface AnswerModeToggleProps {
  mode: AnswerMode;
  onModeChange: (mode: AnswerMode) => void;
}

const AnswerModeToggle: React.FC<AnswerModeToggleProps> = ({
  mode,
  onModeChange
}) => {
  return (
    <Card className="mb-6 border-2 border-dashed border-gray-300">
      <CardContent className="p-4">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Choose Your Approach</h3>
          <p className="text-sm text-gray-600 mt-1">
            How would you like to craft your answer?
          </p>
        </div>
        
        <div className="flex gap-3 justify-center">
          <Button
            variant={mode === 'manual' ? 'default' : 'outline'}
            onClick={() => onModeChange('manual')}
            className={`flex items-center gap-2 px-6 py-3 h-auto flex-col ${
              mode === 'manual' 
                ? 'bg-gray-900 text-white border-gray-900' 
                : 'hover:bg-gray-50'
            }`}
          >
            <PenTool className="w-5 h-5" />
            <div className="text-center">
              <div className="font-medium">Write from scratch</div>
              <div className="text-xs opacity-80 mt-1">
                I'll write my own answer
              </div>
            </div>
          </Button>
          
          <Button
            variant={mode === 'guided' ? 'default' : 'outline'}
            onClick={() => onModeChange('guided')}
            className={`flex items-center gap-2 px-6 py-3 h-auto flex-col ${
              mode === 'guided' 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'hover:bg-blue-50 border-blue-200'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <div className="text-center">
              <div className="font-medium">Use guided help</div>
              <div className="text-xs opacity-80 mt-1">
                AI will help structure my thoughts
              </div>
            </div>
          </Button>
        </div>
        
        {mode && (
          <div className="mt-4 text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              {mode === 'manual' ? (
                <>
                  <PenTool className="w-3 h-3" />
                  Manual Mode Active
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  Guided Mode Active
                </>
              )}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnswerModeToggle;
