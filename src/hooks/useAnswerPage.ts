import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { usePlanStatus } from '@/hooks/usePlanStatus';
import { useAnswers } from '@/hooks/useAnswers';
import { useAnswerFeedback } from '@/hooks/useAnswerFeedback';
import { useResumeText } from '@/hooks/useResumeText';
import { useGuidedResponse } from '@/hooks/useGuidedResponse';
import { Question } from '@/hooks/useQuestionData';

export const useAnswerPage = (storylineId: string | null, questionIndex: number, initialQuestion?: Question) => {
  const { toast } = useToast();
  const [inputAnswer, setInputAnswer] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('current');
  
  const { resumeText } = useResumeText(storylineId || '');
  
  const { 
    isLoading, 
    isSaving, 
    question, 
    answer,
    iterations,
    answerRecord,
    saveAnswer,
    error 
  } = useAnswers(storylineId || '', questionIndex);

  const {
    feedback,
    isLoading: isFeedbackLoading,
    error: feedbackError,
    generateFeedback,
    clearFeedback
  } = useAnswerFeedback(storylineId || '', question, questionIndex);

  // Get the most recent feedback from iterations if available
  const getPreviousFeedback = () => {
    if (iterations.length === 0) return null;
    
    // Look for the most recent iteration with feedback
    const iterationWithFeedback = [...iterations]
      .reverse()
      .find(iteration => iteration.feedback);
    
    return iterationWithFeedback?.feedback || null;
  };

  // Get the most recent answer text from iterations or fall back to saved answer
  const getCurrentAnswerText = () => {
    if (iterations.length > 0) {
      const mostRecentIteration = [...iterations].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];
      
      return mostRecentIteration?.answerText || answer || '';
    }
    return answer || '';
  };

  const previousFeedback = getPreviousFeedback();
  const currentAnswerText = getCurrentAnswerText();
  
  // Pass storylineId directly as a parameter
  const { generatingAnswer, processingThoughts, generateGuidedResponse } = useGuidedResponse(
    questionIndex, 
    question,
    storylineId || '',
    previousFeedback
  );

  // Sync inputAnswer with currentAnswerText
  useEffect(() => {
    if (currentAnswerText !== inputAnswer) {
      setInputAnswer(currentAnswerText);
    }
  }, [currentAnswerText]);

  useEffect(() => {
    // Clear feedback when switching tabs or when the answer changes
    if (activeTab !== 'current') {
      clearFeedback();
    }
  }, [activeTab, clearFeedback]);

  // Listen for response received event
  useEffect(() => {
    const handleResponseReceived = (event: CustomEvent) => {
      const { generatedResponse } = event.detail;
      if (generatedResponse) {
        setInputAnswer(generatedResponse);
        
        toast({
          title: "Response Added",
          description: "The generated response has been added to your answer.",
        });
      }
    };

    window.addEventListener('responseReceived' as any, handleResponseReceived);
    
    return () => {
      window.removeEventListener('responseReceived' as any, handleResponseReceived);
    };
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (inputAnswer.trim().length < 30) {
      toast({
        variant: "destructive",
        title: "Answer too short",
        description: "Please provide a more complete answer (minimum 30 characters).",
      });
      return;
    }
    
    if (storylineId) {
      // Generate feedback before saving
      const feedbackData = await generateFeedback(inputAnswer);
      
      if (feedbackData) {
        // Save answer with the feedback data
        await saveAnswer(inputAnswer, feedbackData);
        
        toast({
          title: "Success",
          description: "Your answer has been saved and feedback generated.",
        });
      } else {
        // If feedback generation failed, still save the answer without feedback
        await saveAnswer(inputAnswer, null);
      }
    }
  };

  const handleGenerateAnswer = async () => {
    if (!question) return;
    await generateGuidedResponse(currentAnswerText, resumeText);
  };

  return {
    inputAnswer,
    setInputAnswer,
    generatingAnswer,
    processingThoughts,
    activeTab,
    setActiveTab,
    isLoading,
    isSaving,
    question,
    answer,
    iterations,
    error,
    feedback,
    isFeedbackLoading,
    feedbackError,
    handleSubmit,
    handleGenerateAnswer
  };
};
