
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAnswers = (jobId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: answers, isLoading } = useQuery({
    queryKey: ['answers', jobId],
    queryFn: async () => {
      if (!jobId) return [];
      
      const { data, error } = await supabase
        .from('storyline_answers')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!jobId
  });

  const createAnswerMutation = useMutation({
    mutationFn: async ({ jobId, questionId, answer }: { 
      jobId: string; 
      questionId: string; 
      answer: string; 
    }) => {
      const { data, error } = await supabase
        .from('storyline_answers')
        .insert({
          job_id: jobId,
          question_id: questionId,
          answer: answer
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['answers', jobId] });
      toast({
        title: "Answer saved",
        description: "Your answer has been saved successfully.",
      });
    },
    onError: (error) => {
      console.error('Error saving answer:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save your answer. Please try again.",
      });
    }
  });

  const updateAnswerMutation = useMutation({
    mutationFn: async ({ answerId, answer }: { answerId: string; answer: string }) => {
      const { data, error } = await supabase
        .from('storyline_answers')
        .update({ answer: answer })
        .eq('id', answerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['answers', jobId] });
      toast({
        title: "Answer updated",
        description: "Your answer has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating answer:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update your answer. Please try again.",
      });
    }
  });

  const deleteAnswerMutation = useMutation({
    mutationFn: async (answerId: string) => {
      const { error } = await supabase
        .from('storyline_answers')
        .delete()
        .eq('id', answerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['answers', jobId] });
      toast({
        title: "Answer deleted",
        description: "Your answer has been deleted.",
      });
    },
    onError: (error) => {
      console.error('Error deleting answer:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete your answer. Please try again.",
      });
    }
  });

  const submitAnswer = async (questionId: string, answer: string) => {
    if (!jobId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No job selected",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if answer already exists
      const existingAnswer = answers?.find(a => a.question_id === questionId);
      
      if (existingAnswer) {
        await updateAnswerMutation.mutateAsync({
          answerId: existingAnswer.id,
          answer: answer
        });
      } else {
        await createAnswerMutation.mutateAsync({
          jobId,
          questionId,
          answer
        });
      }
    } catch (error) {
      console.error('Error in submitAnswer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteAnswer = async (answerId: string) => {
    await deleteAnswerMutation.mutateAsync(answerId);
  };

  const getAnswerForQuestion = (questionId: string) => {
    return answers?.find(answer => answer.question_id === questionId);
  };

  // Get feedback data safely
  const getFeedbackData = () => {
    if (!answers || answers.length === 0) return null;
    
    const answerWithFeedback = answers.find(answer => 
      answer.feedback && 
      typeof answer.feedback === 'object' && 
      answer.feedback !== null
    );
    
    if (!answerWithFeedback?.feedback) return null;
    
    try {
      // Handle both string and object feedback
      const feedback = typeof answerWithFeedback.feedback === 'string' 
        ? JSON.parse(answerWithFeedback.feedback)
        : answerWithFeedback.feedback;
      
      return feedback;
    } catch (error) {
      console.error('Error parsing feedback:', error);
      return null;
    }
  };

  return {
    answers: answers || [],
    isLoading,
    isSubmitting,
    submitAnswer,
    deleteAnswer,
    getAnswerForQuestion,
    getFeedbackData
  };
};
