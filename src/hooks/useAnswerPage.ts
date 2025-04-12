
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUserTokens } from '@/hooks/useUserTokens';
import { useAnswers } from '@/hooks/useAnswers';
import { useAnswerFeedback } from '@/hooks/useAnswerFeedback';
import { useResumeText } from '@/hooks/useResumeText';
import { useGuidedResponse } from '@/hooks/useGuidedResponse';

export const useAnswerPage = (storylineId: string | null, questionIndex: number) => {
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

  const { generatingAnswer, generateGuidedResponse } = useGuidedResponse(questionIndex, question);

  useEffect(() => {
    console.log('AnswerPage: iterations updated from useAnswers', iterations);
  }, [iterations]);

  useEffect(() => {
    if (answer && answer !== inputAnswer) {
      setInputAnswer(answer);
    }
  }, [answer]);

  useEffect(() => {
    // Clear feedback when switching tabs or when the answer changes
    if (activeTab !== 'current') {
      clearFeedback();
    }
  }, [activeTab, clearFeedback]);

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
        await saveAnswer(inputAnswer);
      }
    }
  };

  const handleGenerateAnswer = async () => {
    if (!question) return;
    await generateGuidedResponse(inputAnswer, resumeText);
  };

  return {
    inputAnswer,
    setInputAnswer,
    generatingAnswer,
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
