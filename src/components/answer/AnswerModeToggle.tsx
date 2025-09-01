
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
    <Card className="mb-6 border-0 bg-gradient-to-b from-blue-50 to-white shadow-lg">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-3">How Would You Like to Answer?</h3>
          <div className="max-w-2xl mx-auto space-y-2">
            <p className="text-base text-gray-700 font-medium">
              ✨ Not sure where to start? Let the AI Coach guide you step-by-step
            </p>
            <p className="text-sm text-gray-600">
              Answering behavioral questions can be overwhelming. Our AI Coach breaks it down into bite-sized steps 
              and helps you shape a STAR-based answer — perfect if you're not sure where to start.
            </p>
          </div>
        </div>
        
        <div className="flex gap-4 justify-center">
          {/* Guided Mode - Primary/Default */}
          <Button
            variant="default"
            onClick={() => onModeChange('guided')}
            className={`flex items-center gap-3 px-8 py-4 h-auto flex-col relative rounded-xl transform transition-all min-w-[240px] ${
              mode === 'guided' 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-2 border-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-xl scale-105 ring-4 ring-blue-100' 
                : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl hover:scale-105'
            }`}
          >
            <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-lg">
              Recommended
            </div>
            <Sparkles className="w-6 h-6" />
            <div className="text-center">
              <div className="font-bold text-lg">Get Step-by-Step Coaching</div>
              <div className="text-sm opacity-95 mt-1">
                AI breaks it down & guides you
              </div>
            </div>
          </Button>
          
          {/* Manual Mode - Secondary */}
          <Button
            variant="outline"
            onClick={() => onModeChange('manual')}
            className={`flex items-center gap-3 px-8 py-4 h-auto flex-col rounded-xl min-w-[240px] ${
              mode === 'manual' 
                ? 'border-2 border-gray-700 bg-gray-50 text-gray-900 hover:bg-gray-100 shadow-md' 
                : 'border-2 border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800 bg-white hover:bg-gray-50'
            }`}
          >
            <PenTool className="w-6 h-6" />
            <div className="text-center">
              <div className="font-semibold text-lg">Manual Mode</div>
              <div className="text-sm opacity-80 mt-1">
                Write your answer directly
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
