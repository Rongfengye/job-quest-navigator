
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
    <Card className="border-2 border-dashed border-gray-300 bg-gray-50/30">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Approach</h2>
          <p className="text-gray-600">
            How would you like to craft your answer?
          </p>
        </div>
        
        <div className="flex gap-4 justify-center max-w-2xl mx-auto">
          <Button
            variant={mode === 'manual' ? 'default' : 'outline'}
            onClick={() => onModeChange('manual')}
            className={`flex-1 flex items-center gap-3 px-6 py-6 h-auto flex-col transition-all ${
              mode === 'manual' 
                ? 'bg-gray-900 text-white border-gray-900 shadow-lg scale-105' 
                : 'hover:bg-gray-50 hover:border-gray-400 hover:shadow-md'
            }`}
          >
            <PenTool className="w-8 h-8" />
            <div className="text-center">
              <div className="font-semibold text-lg">Write from scratch</div>
              <div className="text-sm opacity-90 mt-1">
                I'll write my own answer
              </div>
            </div>
          </Button>
          
          <Button
            variant={mode === 'guided' ? 'default' : 'outline'}
            onClick={() => onModeChange('guided')}
            className={`flex-1 flex items-center gap-3 px-6 py-6 h-auto flex-col transition-all ${
              mode === 'guided' 
                ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105' 
                : 'hover:bg-blue-50 border-blue-200 hover:border-blue-300 hover:shadow-md'
            }`}
          >
            <Sparkles className="w-8 h-8" />
            <div className="text-center">
              <div className="font-semibold text-lg">Use guided help</div>
              <div className="text-sm opacity-90 mt-1">
                AI will help structure my thoughts
              </div>
            </div>
          </Button>
        </div>
        
        {/* Phase 4: Enhanced State Communication */}
        {mode && (
          <div className="mt-6 text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shadow-sm ${
              mode === 'manual' 
                ? 'bg-gray-100 text-gray-800 border border-gray-200'
                : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              {mode === 'manual' ? (
                <>
                  <PenTool className="w-4 h-4" />
                  <span>Manual Mode Active</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Guided Mode Active</span>
                </>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {mode === 'manual' 
                ? 'You can write and edit your answer directly'
                : 'AI will guide you through a structured process'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnswerModeToggle;
