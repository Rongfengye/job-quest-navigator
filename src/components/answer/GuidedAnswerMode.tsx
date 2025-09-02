
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, HelpCircle, ArrowRight, PenTool, CheckCircle, Brain, MessageSquare } from 'lucide-react';
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
  const [shouldPulse, setShouldPulse] = useState(false);
  const [shouldPulseThoughts, setShouldPulseThoughts] = useState(false);
  const [shouldPulseAnswer, setShouldPulseAnswer] = useState(false);

  // Listen for guidance received event
  useEffect(() => {
    const handleGuidanceReceived = (event: CustomEvent) => {
      setGuidingQuestions(event.detail.guidingQuestions);
      setCurrentStep('thoughts');
      setShouldPulseThoughts(true);
      
      // Stop pulsing thoughts after 5 seconds
      setTimeout(() => {
        setShouldPulseThoughts(false);
      }, 5000);
    };

    window.addEventListener('guidanceReceived' as any, handleGuidanceReceived);
    
    return () => {
      window.removeEventListener('guidanceReceived' as any, handleGuidanceReceived);
    };
  }, []);

  const handleStartGuided = () => {
    setCurrentStep('questions');
    setShouldPulse(true);
    
    // Stop pulsing after 5 seconds
    setTimeout(() => {
      setShouldPulse(false);
    }, 5000);
    
    handleGenerateAnswer();
  };

  const handleSubmitThoughts = () => {
    if (thoughts.trim()) {
      setShouldPulseAnswer(true);
      
      // Stop pulsing answer after 5 seconds
      setTimeout(() => {
        setShouldPulseAnswer(false);
      }, 5000);
      
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
                <CardTitle className="text-xl text-blue-900">AI Interview Coach</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onModeChange('manual')}
                  className="text-xs text-gray-600 hover:text-gray-700 hover:bg-gray-100 px-2 py-1 h-auto rounded-md border border-gray-300"
                >
                  <PenTool className="w-3 h-3 mr-1.5" />
                  Write Manually Instead
                </Button>
              </div>
              <p className="text-sm text-blue-700">
                Transform your experiences into a structured answer in a few simple steps
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Enhanced Journey Step Indicator - Only in Guided Mode */}
        <div className="relative px-4">
          {/* Current Step Label */}
          <div className="text-center mb-4">
            <p className="text-sm font-medium text-gray-700">
              Step {currentStep === 'questions' && !guidingQuestions ? '1' : currentStep === 'thoughts' ? '2' : '3'} of 3: 
              <span className="text-blue-600">
                {currentStep === 'questions' && !guidingQuestions ? 'Understand the Question' 
                 : currentStep === 'thoughts' ? 'Share Your Thoughts'
                 : 'Get Your Answer'}
              </span>
            </p>
          </div>
          {/* Progress Line */}
          <div className="absolute top-14 left-0 right-0 h-0.5 bg-gray-200">
            <div 
              className="h-full bg-blue-600 transition-all duration-500 ease-out"
              style={{ 
                width: currentStep === 'questions' && !guidingQuestions ? '0%' 
                     : currentStep === 'questions' && guidingQuestions ? '33%'
                     : currentStep === 'thoughts' ? '66%' 
                     : '100%' 
              }}
            />
          </div>
          
          {/* Steps */}
          <div className="relative flex items-start justify-between pt-2">
            {/* Step 1: Understand */}
            <div className={`flex flex-col items-center transition-all duration-300 ${
              currentStep === 'questions' ? 'scale-110' : ''
            }`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                guidingQuestions 
                  ? 'bg-green-100 border-2 border-green-500' 
                  : currentStep === 'questions'
                    ? `bg-blue-600 text-white shadow-lg shadow-blue-200 ${shouldPulse ? 'animate-pulse' : ''}`
                    : 'bg-gray-100 border-2 border-gray-300'
              }`}>
                {guidingQuestions ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <Brain className="w-8 h-8" />
                )}
              </div>
              <span className="text-xs font-medium mt-2 text-center">
                Understand<br />the Question
              </span>
            </div>

            {/* Step 2: Share */}
            <div className={`flex flex-col items-center transition-all duration-300 ${
              currentStep === 'thoughts' ? 'scale-110' : ''
            }`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                currentStep === 'thoughts'
                  ? `bg-blue-600 text-white shadow-lg shadow-blue-200 ${shouldPulseThoughts ? 'animate-pulse' : ''}`
                  : processingThoughts
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 border-2 border-gray-300'
              }`}>
                <MessageSquare className="w-8 h-8" />
              </div>
              <span className="text-xs font-medium mt-2 text-center">
                Share Your<br />Thoughts
              </span>
            </div>

            {/* Step 3: Get Answer */}
            <div className="flex flex-col items-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                processingThoughts
                  ? `bg-blue-600 text-white shadow-lg shadow-blue-200 ${shouldPulseAnswer ? 'animate-pulse' : ''}`
                  : 'bg-gray-100 border-2 border-gray-300'
              }`}>
                <Sparkles className={`w-8 h-8 ${processingThoughts ? 'text-white' : 'text-gray-400'}`} />
              </div>
              <span className={`text-xs font-medium mt-2 text-center ${
                processingThoughts ? 'text-gray-900' : 'text-gray-500'
              }`}>
                Get Your<br />Answer
              </span>
            </div>
          </div>
        </div>

        {/* Step 1: Generate Questions */}
        {currentStep === 'questions' && !guidingQuestions && (
          <div className="text-center py-8">
            <div className="mb-6">
              <HelpCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Let's Break This Down Together
              </h3>
              <p className="text-gray-700 max-w-lg mx-auto mb-2">
                Struggling to start? No worries — that's totally normal with behavioral questions!
              </p>
              <p className="text-gray-600 text-sm max-w-md mx-auto">
                I'll ask you a few targeted questions to help uncover the perfect story from your experience.
              </p>
            </div>
            <Button 
              onClick={handleStartGuided}
              disabled={generatingAnswer}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 px-6 py-3"
            >
              <Sparkles className="w-5 h-5" />
              {generatingAnswer ? 'Creating Your Questions...' : 'Break It Down With AI →'}
            </Button>
          </div>
        )}

        {/* Loading State for Questions */}
        {generatingAnswer && currentStep === 'questions' && (
          <div className="text-center py-8">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping"></div>
              <div className="relative w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center">
                <Brain className="w-10 h-10 text-white animate-pulse" />
              </div>
            </div>
            <p className="text-blue-700 font-medium">Analyzing the question...</p>
            <p className="text-blue-600 text-sm mt-1">Creating personalized guidance just for you</p>
          </div>
        )}

        {/* Step 2: Integrated Guiding Questions and Thoughts Input */}
        {guidingQuestions && currentStep === 'thoughts' && (
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-bold mb-3 text-gray-900 flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600" />
              Reflect on these before typing:
            </h3>
            
            {/* Integrated Guiding Questions */}
            <ul className="space-y-2 mb-6 pl-4">
              {guidingQuestions.map((question, index) => (
                <li key={`question-${index}`} className="flex gap-2 text-sm">
                  <span className="font-medium text-blue-600 flex-shrink-0">•</span>
                  <span className="text-gray-700">{question}</span>
                </li>
              ))}
            </ul>
            
            <Textarea
              value={thoughts}
              onChange={(e) => setThoughts(e.target.value)}
              placeholder="Type your raw thoughts here... What situation comes to mind? What actions did you take? No need to be perfect!"
              className="min-h-[200px] resize-y mb-4 text-base"
              disabled={processingThoughts}
            />
            
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitThoughts}
                disabled={!thoughts.trim() || processingThoughts}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 px-6"
              >
                <Sparkles className="h-5 w-5" />
                {processingThoughts ? 'Creating Your STAR Answer...' : 'Transform Into STAR Answer →'}
              </Button>
            </div>
          </div>
        )}

        {/* Processing State */}
        {processingThoughts && (
          <div className="text-center py-8">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full bg-purple-100 animate-ping"></div>
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-white animate-spin" />
              </div>
            </div>
            <p className="text-purple-700 font-medium">Working my magic...</p>
            <p className="text-purple-600 text-sm mt-1">Transforming your thoughts into a polished STAR answer</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GuidedAnswerMode;
