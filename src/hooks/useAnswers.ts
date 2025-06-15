import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Answer {
  id: string;
  response: string;
  feedback: any;
  created_at: string;
  updated_at: string;
  question_id: string;
  user_id: string;
}

interface Question {
  id: string;
  question: string;
  type: string;
  difficulty: string;
  category: string;
  job_id: string;
  created_at: string;
  updated_at: string;
}

export const useAnswers = (questionId: string) => {
  const [currentAnswer, setCurrentAnswer] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch answers for this question
  const { data: answers, isLoading: answersLoading, error: answersError } = useQuery({
    queryKey: ['answers', questionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('storyline_answers')
        .select('*')
        .eq('question_id', questionId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data as Answer[];
    },
    enabled: !!questionId
  });

  // Fetch question details
  const { data: question, isLoading: questionLoading, error: questionError } = useQuery({
    queryKey: ['question', questionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('storyline_questions')
        .select('*')
        .eq('id', questionId)
        .single();
        
      if (error) throw error;
      return data as Question;
    },
    enabled: !!questionId
  });

  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async (answerText: string) => {
      const { data, error } = await supabase
        .from('storyline_answers')
        .insert({
          question_id: questionId,
          response: answerText
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['answers', questionId] });
      setCurrentAnswer('');
      toast({
        title: "Answer submitted",
        description: "Your answer has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit answer. Please try again.",
      });
      console.error('Error submitting answer:', error);
    }
  });

  // Generate feedback mutation
  const generateFeedbackMutation = useMutation({
    mutationFn: async (answerId: string) => {
      const { data, error } = await supabase.functions.invoke('storyline-guided-response-generator', {
        body: {
          type: 'generate-feedback',
          answerId: answerId
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, answerId) => {
      queryClient.invalidateQueries({ queryKey: ['answers', questionId] });
      
      // Update the specific answer with feedback
      const updatedAnswers = answers?.map(answer => 
        answer.id === answerId 
          ? { ...answer, feedback: data.feedback }
          : answer
      );
      
      if (updatedAnswers) {
        queryClient.setQueryData(['answers', questionId], updatedAnswers);
      }
      
      toast({
        title: "Feedback generated",
        description: "Your answer feedback has been generated.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate feedback. Please try again.",
      });
      console.error('Error generating feedback:', error);
    }
  });

  // Delete answer mutation
  const deleteAnswerMutation = useMutation({
    mutationFn: async (answerId: string) => {
      const { error } = await supabase
        .from('storyline_answers')
        .delete()
        .eq('id', answerId);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['answers', questionId] });
      toast({
        title: "Answer deleted",
        description: "Your answer has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete answer. Please try again.",
      });
      console.error('Error deleting answer:', error);
    }
  });

  const submitAnswer = () => {
    if (!currentAnswer.trim()) {
      toast({
        variant: "destructive",
        title: "Empty answer",
        description: "Please provide an answer before submitting.",
      });
      return;
    }
    
    submitAnswerMutation.mutate(currentAnswer);
  };

  const generateFeedback = (answerId: string) => {
    generateFeedbackMutation.mutate(answerId);
  };

  const deleteAnswer = (answerId: string) => {
    deleteAnswerMutation.mutate(answerId);
  };

  const isLoading = answersLoading || questionLoading;
  const error = answersError || questionError;

  // Get the most recent answer for auto-population
  const mostRecentAnswer = answers && answers.length > 0 ? answers[0] : null;

  // Auto-populate current answer with most recent if exists and current is empty
  useEffect(() => {
    if (mostRecentAnswer && !currentAnswer) {
      setCurrentAnswer(mostRecentAnswer.response);
    }
  }, [mostRecentAnswer, currentAnswer]);

  return {
    answers: answers || [],
    question,
    currentAnswer,
    setCurrentAnswer,
    submitAnswer,
    generateFeedback,
    deleteAnswer,
    isLoading,
    error,
    isSubmitting: submitAnswerMutation.isPending,
    isGeneratingFeedback: generateFeedbackMutation.isPending,
    isDeletingAnswer: deleteAnswerMutation.isPending,
    mostRecentAnswer
  };
};
