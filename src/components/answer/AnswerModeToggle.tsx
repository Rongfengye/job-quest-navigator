
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
          <h3 className="text-lg font-semibold text-gray-900">How Would You Like to Answer?</h3>
          <p className="text-sm text-gray-600 mt-1">
            Most users find the AI coach helps them create better answers faster
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
            className={`flex items-center gap-2 px-6 py-3 h-auto flex-col relative ${
              mode === 'guided' 
                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' 
                : 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400'
            }`}
          >
            <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
              Recommended
            </div>
            <Sparkles className="w-5 h-5" />
            <div className="text-center">
              <div className="font-medium">Get AI Coaching</div>
              <div className="text-xs opacity-80 mt-1">
                Turn thoughts into structured responses
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
