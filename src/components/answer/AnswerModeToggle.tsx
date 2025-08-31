
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
            variant="outline"
            onClick={() => onModeChange('manual')}
            className={`flex items-center gap-2 px-6 py-3 h-auto flex-col rounded-lg ${
              mode === 'manual' 
                ? 'border-2 border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100' 
                : 'border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-black bg-white'
            }`}
          >
            <PenTool className="w-5 h-5" />
            <div className="text-center">
              <div className="font-medium">Write from Scratch</div>
              <div className="text-xs opacity-80 mt-1">
                I'll write my own answer
              </div>
            </div>
          </Button>
          
          <Button
            variant="default"
            onClick={() => onModeChange('guided')}
            className={`flex items-center gap-2 px-6 py-3 h-auto flex-col relative rounded-lg transform transition-all ${
              mode === 'guided' 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0 hover:from-blue-700 hover:to-blue-800 shadow-lg scale-105' 
                : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg hover:scale-105'
            }`}
          >
            <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium shadow-sm">
              Recommended
            </div>
            <Sparkles className="w-5 h-5" />
            <div className="text-center">
              <div className="font-semibold text-base">Get AI Coaching</div>
              <div className="text-xs opacity-90 mt-1">
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
