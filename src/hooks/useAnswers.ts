import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Question } from '@/hooks/useQuestionData';
import { FeedbackData } from '@/hooks/useAnswerFeedback';
import { filterValue } from '@/utils/supabaseTypes';

export interface AnswerIteration {
  answerText: string;
  feedback?: FeedbackData | null;
  timestamp: string;
}

type QuestionType = 'technical' | 'behavioral' | 'original-behavioral';

function isQuestionType(type: string): type is QuestionType {
  return ['technical', 'behavioral', 'original-behavioral'].includes(type);
}

export const useAnswers = (storylineId: string, questionIndex: number) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const queryKey = ['answer', storylineId, questionIndex];

  const { data: answerRecord, isLoading, error } = useQuery({
    queryKey: queryKey,
    queryFn: async () => {
      if (!storylineId) return null;
      
      const { data, error } = await supabase
        .from('storyline_job_questions')
        .select('*')
        .eq('storyline_id', filterValue(storylineId))
        .eq('question_index', questionIndex)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No answer record found, which is fine.');
          return null;
        }
        console.error('Error fetching answer:', error);
        throw error;
      }
      return data;
    },
    enabled: !!storylineId,
  });

  const question: Question | null = answerRecord ? {
    question: answerRecord.question,
    type: isQuestionType(answerRecord.type) ? answerRecord.type : undefined,
  } : null;

  const answer: string | null = answerRecord?.answer ?? null;
  
  let iterations: AnswerIteration[] = [];
  if (answerRecord && answerRecord.iterations) {
    if (typeof answerRecord.iterations === 'string') {
      try {
        iterations = JSON.parse(answerRecord.iterations);
      } catch (e) {
        console.error("Failed to parse iterations", e);
      }
    } else if (Array.isArray(answerRecord.iterations)) {
      iterations = answerRecord.iterations as any;
    }
  }

  const saveAnswerMutation = useMutation({
    mutationFn: async ({ answerText, feedback }: { answerText: string; feedback?: FeedbackData | null }) => {
      if (!storylineId) throw new Error("Storyline ID is missing");

      setIsSaving(true);
      
      const newIteration: AnswerIteration = {
        answerText,
        feedback: feedback || null,
        timestamp: new Date().toISOString(),
      };
      
      const updatedIterations = [...iterations, newIteration];

      const { data, error } = await supabase
        .from('storyline_job_questions')
        .update({
          answer: answerText,
          iterations: updatedIterations as any,
          updated_at: new Date().toISOString(),
        })
        .eq('storyline_id', filterValue(storylineId))
        .eq('question_index', questionIndex)
        .select()
        .single();

      if (error) {
        console.error('Error saving answer:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
      queryClient.invalidateQueries({ queryKey: ['storyline', storylineId] });
      toast({
        title: "Success",
        description: "Your answer has been saved.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to save answer: ${error.message}`,
      });
    },
    onSettled: () => {
      setIsSaving(false);
    },
  });

  const saveAnswer = useCallback(
    async (answerText: string, feedback?: FeedbackData | null) => {
      await saveAnswerMutation.mutateAsync({ answerText, feedback });
    },
    [saveAnswerMutation]
  );
  
  return {
    isLoading,
    isSaving,
    question,
    answer,
    iterations,
    answerRecord,
    saveAnswer,
    error: error ? error.message : null,
  };
};
