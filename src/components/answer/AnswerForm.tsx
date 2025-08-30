
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Question } from '@/hooks/useQuestionData';
import { QuestionVaultFeedback } from '@/hooks/useAnswerFeedback';
import AnswerModeToggle, { AnswerMode } from './AnswerModeToggle';
import ManualAnswerMode from './ManualAnswerMode';
import GuidedAnswerMode from './GuidedAnswerMode';
import AnswerFeedback from './AnswerFeedback';
import ProgressIndicator from './ProgressIndicator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

interface AnswerFormProps {
  inputAnswer: string;
  setInputAnswer: (value: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  handleGenerateAnswer: () => void;
  isSaving: boolean;
  generatingAnswer: boolean;
  question: Question | null;
  feedback: QuestionVaultFeedback | null;
  isFeedbackLoading: boolean;
  feedbackError: string | null;
  processingThoughts: boolean;
  initialMode?: string;
}

const AnswerForm: React.FC<AnswerFormProps> = ({
  inputAnswer,
  setInputAnswer,
  handleSubmit,
  handleGenerateAnswer,
  isSaving,
  generatingAnswer,
  question,
  feedback,
  isFeedbackLoading,
  feedbackError,
  processingThoughts,
  initialMode = 'manual'
}) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<AnswerMode>(initialMode as AnswerMode);
  const [progressValue, setProgressValue] = useState(0);
  const [hasUnsavedDraft, setHasUnsavedDraft] = useState(false);
  const [originalAnswer, setOriginalAnswer] = useState('');
  const [showInitialModeSelection, setShowInitialModeSelection] = useState(true);
  const [guidedResponseGenerated, setGuidedResponseGenerated] = useState(false);

  // Hide initial mode selection once user has an answer or has made a mode choice
  useEffect(() => {
    if (inputAnswer.trim().length > 0) {
      setShowInitialModeSelection(false);
    }
  }, [inputAnswer]);

  const handleModeChange = (newMode: AnswerMode) => {
    setMode(newMode);
    setShowInitialModeSelection(false);
  };

  // Track original answer to detect changes - set it immediately when inputAnswer first has content
  useEffect(() => {
    if (inputAnswer && !originalAnswer && !guidedResponseGenerated) {
      setOriginalAnswer(inputAnswer);
    }
  }, [inputAnswer, originalAnswer, guidedResponseGenerated]);

  // Detect if there are unsaved changes
  useEffect(() => {
    if (inputAnswer !== originalAnswer && inputAnswer.trim().length > 0) {
      setHasUnsavedDraft(true);
    } else {
      setHasUnsavedDraft(false);
    }
  }, [inputAnswer, originalAnswer]);

  // Simulate progress when feedback is loading or when generating answer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isFeedbackLoading || generatingAnswer || processingThoughts) {
      setProgressValue(0);
      
      interval = setInterval(() => {
        setProgressValue(prev => {
          if (prev < 90) {
            return prev + (90 - prev) * 0.1;
          }
          return prev;
        });
      }, 300);
    } else {
      setProgressValue(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isFeedbackLoading, generatingAnswer, processingThoughts]);

  // Listen for response received event to switch back to manual mode
  useEffect(() => {
    const handleResponseReceived = (event: CustomEvent) => {
      const { generatedResponse } = event.detail;
      if (generatedResponse) {
        // Mark that a guided response was generated
        setGuidedResponseGenerated(true);
        
        // Set the generated response
        setInputAnswer(generatedResponse);
        
        // If this is the first content, set it as original to compare against future changes
        if (!originalAnswer) {
          setOriginalAnswer('');
        }
        
        // Switch back to manual mode
        setMode('manual');
        
        // Mark as having unsaved draft since this is new generated content
        setHasUnsavedDraft(true);
        
        toast({
          title: "Response Generated!",
          description: "Your structured answer is ready. You can now edit and save it.",
        });
      }
    };

    window.addEventListener('responseReceived' as any, handleResponseReceived);
    
    return () => {
      window.removeEventListener('responseReceived' as any, handleResponseReceived);
    };
  }, [toast, setInputAnswer, originalAnswer]);

  const handleThoughtsSubmit = (thoughts: string) => {
    const thoughtsEvent = new CustomEvent('thoughtsSubmitted', {
      detail: { thoughts }
    });
    window.dispatchEvent(thoughtsEvent);
  };

  const handleSaveAnswer = (e: React.FormEvent<HTMLFormElement>) => {
    setHasUnsavedDraft(false);
    setOriginalAnswer(inputAnswer);
    setGuidedResponseGenerated(false); // Reset the guided response flag after saving
    handleSubmit(e);
  };

  const loadingText = processingThoughts 
    ? 'Transforming your thoughts into a response...'
    : generatingAnswer 
      ? 'Generating guiding questions...' 
      : isFeedbackLoading 
        ? 'Generating feedback...' 
        : 'Completing...';

  return (
    <div className="space-y-6">
      {/* Show big mode selection only initially */}
      {showInitialModeSelection && (
        <AnswerModeToggle 
          mode={mode} 
          onModeChange={handleModeChange} 
        />
      )}

      {/* Don't show mode components until initial selection is made */}
      {!showInitialModeSelection && (
        <>
          {/* Manual Mode */}
          {mode === 'manual' && (
            <ManualAnswerMode
              inputAnswer={inputAnswer}
              setInputAnswer={setInputAnswer}
              handleSubmit={handleSaveAnswer}
              isSaving={isSaving}
              feedback={feedback}
              hasUnsavedDraft={hasUnsavedDraft}
              onModeChange={setMode}
              currentMode={mode}
            />
          )}

          {/* Guided Mode */}
          {mode === 'guided' && (
            <GuidedAnswerMode
              question={question}
              generatingAnswer={generatingAnswer}
              processingThoughts={processingThoughts}
              handleGenerateAnswer={handleGenerateAnswer}
              onThoughtsSubmit={handleThoughtsSubmit}
              onModeChange={setMode}
              currentMode={mode}
            />
          )}
        </>
      )}

      {/* Progress Indicator */}
      <ProgressIndicator 
        isLoading={isFeedbackLoading || generatingAnswer || processingThoughts} 
        progressValue={progressValue}
        loadingText={loadingText}
      />

      {/* Feedback Section - only show in manual mode and when not in initial selection */}
      {!showInitialModeSelection && mode === 'manual' && (isFeedbackLoading || feedback) && (
        <Card className="border-2 border-dashed border-green-200 bg-green-50/30">
          <Accordion type="single" collapsible className="w-full" defaultValue="feedback">
            <AccordionItem value="feedback" className="border-none">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-green-50/50">
                <div className="flex items-center gap-3 text-left">
                  <Lightbulb className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">Answer Feedback</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Review your score and improvement suggestions
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="border-t border-green-200 pt-6">
                  <AnswerFeedback 
                    feedback={feedback}
                    isLoading={isFeedbackLoading}
                    error={feedbackError} 
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      )}
    </div>
  );
};

export default AnswerForm;
