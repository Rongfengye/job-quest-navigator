
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, HelpCircle, ArrowRight, PenTool } from 'lucide-react';
import { Question } from '@/hooks/useQuestionData';
import { AnswerMode } from './AnswerModeToggle';

interface GuidedAnswerModeProps {
  question: Question | null;
  generatingAnswer: boolean;
  processingThoughts: boolean;
  handleGenerateAnswer: () => void;
  onThoughtsSubmit: (thoughts: string) => void;
  onModeChange: (mode: AnswerMode) => void;
  currentMode: AnswerMode;
}

const GuidedAnswerMode: React.FC<GuidedAnswerModeProps> = ({
  question,
  generatingAnswer,
  processingThoughts,
  handleGenerateAnswer,
  onThoughtsSubmit,
  onModeChange,
  currentMode
}) => {
  const [currentStep, setCurrentStep] = useState<'questions' | 'thoughts'>('questions');
  const [guidingQuestions, setGuidingQuestions] = useState<string[] | null>(null);
  const [thoughts, setThoughts] = useState('');

  // Listen for guidance received event
  useEffect(() => {
    const handleGuidanceReceived = (event: CustomEvent) => {
      setGuidingQuestions(event.detail.guidingQuestions);
      setCurrentStep('thoughts');
    };

    window.addEventListener('guidanceReceived' as any, handleGuidanceReceived);
    
    return () => {
      window.removeEventListener('guidanceReceived' as any, handleGuidanceReceived);
    };
  }, []);

  const handleStartGuided = () => {
    setCurrentStep('questions');
    handleGenerateAnswer();
  };

  const handleSubmitThoughts = () => {
    if (thoughts.trim()) {
      onThoughtsSubmit(thoughts);
      setThoughts('');
    }
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/30">
      <CardHeader className="border-b border-blue-200 bg-blue-50/50">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <CardTitle className="text-xl text-blue-900">Guided Response Workshop</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onModeChange('manual')}
                  className="text-xs text-gray-600 hover:text-gray-700 hover:bg-gray-100 px-2 py-1 h-auto rounded-md border border-gray-300"
                >
                  <PenTool className="w-3 h-3 mr-1.5" />
                  Switch to Manual
                </Button>
              </div>
              <p className="text-sm text-blue-700">
                I'll help you structure your thoughts into a compelling answer
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
            currentStep === 'questions' 
              ? 'bg-blue-600 text-white' 
              : guidingQuestions 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
          }`}>
            <span className="w-4 h-4 rounded-full bg-current bg-opacity-20 flex items-center justify-center text-xs">1</span>
            Generate Questions
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
            currentStep === 'thoughts' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            <span className="w-4 h-4 rounded-full bg-current bg-opacity-20 flex items-center justify-center text-xs">2</span>
            Share Your Thoughts
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            <span className="w-4 h-4 rounded-full bg-current bg-opacity-20 flex items-center justify-center text-xs">3</span>
            Review & Use
          </div>
        </div>

        {/* Step 1: Generate Questions */}
        {currentStep === 'questions' && !guidingQuestions && (
          <div className="text-center py-8">
            <div className="mb-4">
              <HelpCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ready to get started?
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                I'll analyze the question and create personalized guiding questions to help you structure your response.
              </p>
            </div>
            <Button 
              onClick={handleStartGuided}
              disabled={generatingAnswer}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {generatingAnswer ? 'Generating Questions...' : 'Generate Guiding Questions'}
            </Button>
          </div>
        )}

        {/* Loading State for Questions */}
        {generatingAnswer && currentStep === 'questions' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-blue-700">Analyzing the question and generating personalized guidance...</p>
          </div>
        )}

        {/* Step 2: Show Guiding Questions and Thoughts Input */}
        {guidingQuestions && currentStep === 'thoughts' && (
          <div className="space-y-6">
            {/* Guiding Questions */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-blue-900">
                <HelpCircle className="w-5 h-5" />
                Your Guiding Questions
              </h3>
              <p className="text-sm text-blue-700 mb-3">
                Consider these questions to help structure your response:
              </p>
              <ul className="space-y-2">
                {guidingQuestions.map((question, index) => (
                  <li key={`question-${index}`} className="flex gap-2">
                    <span className="font-medium text-blue-600 flex-shrink-0">{index + 1}.</span>
                    <span className="text-gray-800 text-sm">{question}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Thoughts Input */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Share Your Thoughts</h3>
              <p className="text-sm text-gray-600 mb-4">
                Jot down your thoughts, experiences, or ideas related to these questions. Don't worry about structure—just brain dump!
              </p>
              
              <Textarea
                value={thoughts}
                onChange={(e) => setThoughts(e.target.value)}
                placeholder="Share your thoughts, experiences, or examples related to these questions..."
                className="min-h-[150px] resize-y mb-4"
                disabled={processingThoughts}
              />
              
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitThoughts}
                  disabled={!thoughts.trim() || processingThoughts}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {processingThoughts ? 'Creating Your Response...' : 'Generate Structured Response'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Processing State */}
        {processingThoughts && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-blue-700 text-sm">Transforming your thoughts into a structured response...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GuidedAnswerMode;
