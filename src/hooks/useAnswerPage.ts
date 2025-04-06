
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUserTokens } from '@/hooks/useUserTokens';
import { useAnswers } from '@/hooks/useAnswers';
import { useAnswerFeedback } from '@/hooks/useAnswerFeedback';
import { supabase } from '@/integrations/supabase/client';

export const useAnswerPage = (storylineId: string | null, questionIndex: number) => {
  const { toast } = useToast();
  const [inputAnswer, setInputAnswer] = useState<string>('');
  const [generatingAnswer, setGeneratingAnswer] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('current');
  
  const { deductTokens } = useUserTokens();
  
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
    
    const tokenCheck = await deductTokens(1);
    if (!tokenCheck?.success) {
      return;
    }
    
    setGeneratingAnswer(true);
    
    try {
      // Call our guided response generator edge function
      const { data, error } = await supabase.functions.invoke('guided-response-generator', {
        body: {
          questionIndex,
          questionType: question.type,
          questionText: question.question,
          userInput: inputAnswer // Pass the current user input
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data && data.success) {
        // We're not replacing the user's input with a generated answer anymore,
        // just showing the guidance
        
        // Display the guidance information in a toast
        if (data.guidance) {
          toast({
            title: "Response Guide",
            description: "Guiding questions have been provided to help you craft your answer.",
          });
          
          // You might want to display the guiding questions in a more prominent way
          // in the UI, not just as a toast message
        }
      } else {
        throw new Error('Failed to generate guided response');
      }
    } catch (error) {
      console.error('Error generating guided response:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to generate guided response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      
      // Refund token on error
      await deductTokens(-1);
    } finally {
      setGeneratingAnswer(false);
    }
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
