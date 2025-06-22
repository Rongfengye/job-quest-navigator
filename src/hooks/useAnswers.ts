import { useState, useCallback, useEffect } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answerRecord, setAnswerRecord] = useState<any>(null);

  const queryKey = ['answer', storylineId, questionIndex];

  useEffect(() => {
    const fetchAndEnsureQuestionExists = async () => {
      if (!storylineId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      // 1. Try to fetch the existing question record
      const { data: existingRecord, error: fetchError } = await supabase
        .from('storyline_job_questions')
        .select('*')
        .eq('storyline_id', filterValue(storylineId))
        .eq('question_index', questionIndex)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching question record:', fetchError);
        setError('Failed to load question data.');
        setIsLoading(false);
        return;
      }

      if (existingRecord) {
        // 2. If it exists, use it
        setAnswerRecord(existingRecord);
        setIsLoading(false);
        queryClient.setQueryData(queryKey, existingRecord);
        return;
      }

      // 3. If it does not exist, create it
      try {
        // First, get the job data which contains all questions
        const { data: jobData, error: jobError } = await supabase
          .from('storyline_jobs')
          .select('openai_response, user_id')
          .eq('id', filterValue(storylineId))
          .single();

        if (jobError || !jobData) {
          throw new Error(jobError?.message || 'Job not found.');
        }

        const response = jobData.openai_response as any;
        const allQuestions = [
          ...(response?.technicalQuestions || []),
          ...(response?.behavioralQuestions || []),
          ...(response?.originalBehavioralQuestions || []),
        ];
        
        const targetQuestion = allQuestions[questionIndex];

        if (!targetQuestion) {
          throw new Error('Question index is out of bounds.');
        }

        // Now, create the new record in storyline_job_questions
        const { data: newRecord, error: insertError } = await supabase
          .from('storyline_job_questions')
          .insert({
            storyline_id: storylineId,
            user_id: jobData.user_id,
            question_index: questionIndex,
            question: targetQuestion.question,
            explanation: targetQuestion.explanation,
            type: targetQuestion.type,
            answer: '',
            iterations: [],
          })
          .select()
          .single();

        if (insertError) {
          throw new Error(insertError.message || 'Could not create question record.');
        }

        setAnswerRecord(newRecord);
        queryClient.setQueryData(queryKey, newRecord);

      } catch (e: any) {
        console.error('Error ensuring question exists:', e);
        setError(e.message || 'An unexpected error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndEnsureQuestionExists();
  }, [storylineId, questionIndex, queryClient, toast]);

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
    error,
  };
};
