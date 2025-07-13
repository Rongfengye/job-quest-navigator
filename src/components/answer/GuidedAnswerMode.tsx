
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, HelpCircle, ArrowRight, CheckCircle, RotateCcw, X } from 'lucide-react';
import { Question } from '@/hooks/useQuestionData';

interface GuidedAnswerModeProps {
  question: Question | null;
  generatingAnswer: boolean;
  processingThoughts: boolean;
  handleGenerateAnswer: () => void;
  onThoughtsSubmit: (thoughts: string) => void;
  onSwitchToManual: () => void;
}

const GuidedAnswerMode: React.FC<GuidedAnswerModeProps> = ({
  question,
  generatingAnswer,
  processingThoughts,
  handleGenerateAnswer,
  onThoughtsSubmit,
  onSwitchToManual
}) => {
  const [currentStep, setCurrentStep] = useState<'questions' | 'thoughts' | 'review'>('questions');
  const [guidingQuestions, setGuidingQuestions] = useState<string[] | null>(null);
  const [thoughts, setThoughts] = useState('');
  const [generatedResponse, setGeneratedResponse] = useState<string>('');

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

  // Listen for response generated event
  useEffect(() => {
    const handleResponseGenerated = (event: CustomEvent) => {
      const { generatedResponse: response } = event.detail;
      if (response) {
        setGeneratedResponse(response);
        setCurrentStep('review');
      }
    };

    window.addEventListener('responseGenerated' as any, handleResponseGenerated);
    
    return () => {
      window.removeEventListener('responseGenerated' as any, handleResponseGenerated);
    };
  }, []);

  const handleStartGuided = () => {
    setCurrentStep('questions');
    handleGenerateAnswer();
  };

  const handleSubmitThoughts = () => {
    if (thoughts.trim()) {
      onThoughtsSubmit(thoughts);
    }
  };

  const handleUseResponse = () => {
    // Dispatch event to populate main answer and switch to manual mode
    const useResponseEvent = new CustomEvent('useGeneratedResponse', {
      detail: { response: generatedResponse }
    });
    window.dispatchEvent(useResponseEvent);
  };

  const handleRegenerate = () => {
    setCurrentStep('thoughts');
    setGeneratedResponse('');
  };

  const handleStartOver = () => {
    setCurrentStep('questions');
    setGuidingQuestions(null);
    setThoughts('');
    setGeneratedResponse('');
  };

  const getStepStatus = (step: string) => {
    if (step === 'questions') {
      return currentStep === 'questions' ? 'active' : guidingQuestions ? 'completed' : 'pending';
    }
    if (step === 'thoughts') {
      return currentStep === 'thoughts' ? 'active' : generatedResponse ? 'completed' : 'pending';
    }
    if (step === 'review') {
      return currentStep === 'review' ? 'active' : 'pending';
    }
    return 'pending';
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/30">
      <CardHeader className="border-b border-blue-200 bg-blue-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <div>
              <CardTitle className="text-xl text-blue-900">Guided Response Workshop</CardTitle>
              <p className="text-sm text-blue-700 mt-1">
                You are in <strong>AI-guided mode</strong> — I'll help you structure your thoughts
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onSwitchToManual}
            className="text-gray-600 hover:text-gray-800"
          >
            <X className="w-4 h-4 mr-1" />
            Switch to Manual
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Enhanced Step Indicator with Status */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
            getStepStatus('questions') === 'active' 
              ? 'bg-blue-600 text-white shadow-md' 
              : getStepStatus('questions') === 'completed'
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-gray-100 text-gray-600'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
              getStepStatus('questions') === 'completed' ? 'bg-green-600 text-white' : 'bg-current bg-opacity-20'
            }`}>
              {getStepStatus('questions') === 'completed' ? '✓' : '1'}
            </span>
            Generate Questions
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
            getStepStatus('thoughts') === 'active' 
              ? 'bg-blue-600 text-white shadow-md' 
              : getStepStatus('thoughts') === 'completed'
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-gray-100 text-gray-600'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
              getStepStatus('thoughts') === 'completed' ? 'bg-green-600 text-white' : 'bg-current bg-opacity-20'
            }`}>
              {getStepStatus('thoughts') === 'completed' ? '✓' : '2'}
            </span>
            Share Your Thoughts
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
            getStepStatus('review') === 'active' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            <span className="w-5 h-5 rounded-full bg-current bg-opacity-20 flex items-center justify-center text-xs font-bold">3</span>
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
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-blue-900">
                <HelpCircle className="w-5 h-5" />
                Your Guiding Questions
              </h3>
              <p className="text-sm text-blue-700 mb-4">
                Consider these questions to help structure your response:
              </p>
              <ul className="space-y-3">
                {guidingQuestions.map((question, index) => (
                  <li key={`question-${index}`} className="flex gap-3">
                    <span className="font-semibold text-blue-600 flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm">
                      {index + 1}
                    </span>
                    <span className="text-gray-800">{question}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Thoughts Input */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
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
          <div className="text-center py-6 bg-blue-50 rounded-lg border border-blue-200">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-3"></div>
            <p className="text-blue-700 font-medium">Transforming your thoughts into a structured response...</p>
            <p className="text-blue-600 text-sm mt-1">This may take a moment</p>
          </div>
        )}

        {/* Step 3: Review Generated Response */}
        {currentStep === 'review' && generatedResponse && (
          <div className="space-y-6">
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-green-900">Your Structured Response is Ready!</h3>
              </div>
              
              <div className="bg-white p-4 rounded border border-green-200 mb-4 max-h-60 overflow-y-auto">
                <p className="text-gray-800 whitespace-pre-wrap">{generatedResponse}</p>
              </div>
              
              <p className="text-sm text-green-700 mb-4">
                Choose what you'd like to do with this response:
              </p>
              
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleUseResponse}
                  className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Use This Response
                </Button>
                
                <Button
                  onClick={handleRegenerate}
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Edit My Thoughts & Regenerate
                </Button>
                
                <Button
                  onClick={handleStartOver}
                  variant="outline"
                  className="border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Start Over
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GuidedAnswerMode;
