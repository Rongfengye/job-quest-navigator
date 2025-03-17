
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Question } from '@/hooks/useQuestionData';
import { useUserTokens } from '@/hooks/useUserTokens';
import { AnswerIteration } from '@/hooks/useAnswers';

export interface FeedbackData {
  pros: string[];
  cons: string[];
  guidelines: string;
  improvementSuggestions: string;
  score: number;
}

export const useAnswerFeedback = (
  storylineId: string,
  question: Question | null,
  jobTitle: string = '',
  companyName: string = ''
) => {
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { deductTokens } = useUserTokens();

  // Load feedback from the most recent iteration when the component mounts
  useEffect(() => {
    const loadExistingFeedback = async () => {
      if (!storylineId || !question) return;

      try {
        // Look for an existing answer with feedback in the storyline_job_questions table
        const { data, error: fetchError } = await supabase
          .from('storyline_job_questions')
          .select('iterations')
          .eq('storyline_id', storylineId)
          .eq('question_index', question.index || 0)
          .single();

        if (fetchError) {
          if (fetchError.code !== 'PGRST116') { // Not found is ok
            console.error('Error fetching existing feedback:', fetchError);
          }
          return;
        }

        if (data?.iterations && Array.isArray(data.iterations) && data.iterations.length > 0) {
          // Get the last iteration that has feedback
          const lastIterationWithFeedback = [...data.iterations]
            .reverse()
            .find(iteration => iteration.feedback);
          
          if (lastIterationWithFeedback?.feedback) {
            console.log('Found existing feedback:', lastIterationWithFeedback.feedback);
            setFeedback(lastIterationWithFeedback.feedback);
          }
        }
      } catch (err) {
        console.error('Error loading existing feedback:', err);
      }
    };

    loadExistingFeedback();
  }, [storylineId, question]);

  const generateFeedback = async (answerText: string) => {
    if (!answerText.trim() || !question) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide an answer to generate feedback.",
      });
      return null;
    }

    if (answerText.trim().length < 30) {
      toast({
        variant: "destructive",
        title: "Answer too short",
        description: "Please provide a more complete answer to get meaningful feedback (minimum 30 characters).",
      });
      return null;
    }

    // Check if user has enough tokens
    const tokenCheck = await deductTokens(2); // Deduct 2 tokens for feedback
    if (!tokenCheck?.success) {
      toast({
        variant: "destructive",
        title: "Insufficient tokens",
        description: "You need at least 2 tokens to get feedback on your answer.",
      });
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('generate-answer-feedback', {
        body: {
          answerText,
          question: question.question,
          questionType: question.type,
          jobTitle,
          companyName,
          jobDescription: '', // We could add job description if available
        },
      });

      if (error) {
        console.error('Error generating feedback:', error);
        setError(error.message || 'Failed to generate feedback');
        // Refund tokens on error
        await deductTokens(-2);
        return null;
      }

      if (!data || !data.pros || !data.cons) {
        setError('Invalid feedback data received');
        // Refund tokens on error
        await deductTokens(-2);
        return null;
      }

      const feedbackData: FeedbackData = data as FeedbackData;
      setFeedback(feedbackData);
      return feedbackData;
    } catch (err) {
      console.error('Error in feedback generation:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      // Refund tokens on error
      await deductTokens(-2);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearFeedback = () => {
    setFeedback(null);
    setError(null);
  };

  return {
    feedback,
    isLoading,
    error,
    generateFeedback,
    clearFeedback
  };
};
