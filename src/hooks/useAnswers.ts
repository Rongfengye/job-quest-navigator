
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Question } from '@/hooks/useQuestionData';
import { Json } from '@/integrations/supabase/types';
import { useUserTokens } from '@/hooks/useUserTokens';
import { FeedbackData } from '@/hooks/useAnswerFeedback';
import { filterValue, safeDatabaseData } from '@/utils/supabaseTypes';
import { transformIterations, parseOpenAIResponse } from '@/utils/answerUtils';

export interface AnswerIteration {
  answerText: string;
  timestamp: string;
  feedback?: {
    pros: string[];
    cons: string[];
    guidelines: string;
    improvementSuggestions: string;
    score: number;
  };
  [key: string]: any;
}

interface AnswerData {
  id?: string;
  storyline_id: string;
  question_index: number;
  question: string;
  answer: string | null;
  iterations: AnswerIteration[];
  type?: 'technical' | 'behavioral';
}

export const useAnswers = (storylineId: string, questionIndex: number) => {
  const { toast } = useToast();
  const { deductTokens, fetchTokens } = useUserTokens();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [answer, setAnswer] = useState<string>('');
  const [question, setQuestion] = useState<Question | null>(null);
  const [answerRecord, setAnswerRecord] = useState<AnswerData | null>(null);
  const [iterations, setIterations] = useState<AnswerIteration[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch question and answer data on initial load
  useEffect(() => {
    const fetchQuestionAndAnswer = async () => {
      if (!storylineId) {
        setIsLoading(false);
        return;
      }

      try {
        await fetchQuestionData();
        await fetchAnswerData();
      } catch (error) {
        console.error('Error fetching question and answer:', error);
        setError(error instanceof Error ? error.message : "Failed to load question");
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load question",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestionAndAnswer();
  }, [storylineId, questionIndex, toast]);

  // Fetch question data from storyline_jobs
  const fetchQuestionData = async () => {
    const { data: storylineData, error: storylineError } = await supabase
      .from('storyline_jobs')
      .select('openai_response')
      .eq('id', filterValue(storylineId))
      .single();

    if (storylineError) throw storylineError;

    if (storylineData?.openai_response) {
      const safeStorylineData = safeDatabaseData(storylineData);
      let parsedResponse;
      if (typeof safeStorylineData.openai_response === 'string') {
        parsedResponse = JSON.parse(safeStorylineData.openai_response);
      } else {
        parsedResponse = safeStorylineData.openai_response;
      }

      const questions = parseOpenAIResponse(parsedResponse);

      if (questions && questions.length > questionIndex) {
        setQuestion(questions[questionIndex]);
      }
    }
  };

  // Fetch answer data from storyline_job_questions
  const fetchAnswerData = async () => {
    const { data: answerData, error: answerError } = await supabase
      .from('storyline_job_questions')
      .select('*')
      .eq('storyline_id', filterValue(storylineId))
      .eq('question_index', questionIndex)
      .single();

    if (answerError && answerError.code !== 'PGRST116') {
      throw answerError;
    }

    if (answerData) {
      const safeAnswerData = safeDatabaseData(answerData);
      const parsedIterations: AnswerIteration[] = Array.isArray(safeAnswerData.iterations) 
        ? safeAnswerData.iterations 
        : typeof safeAnswerData.iterations === 'string' 
          ? JSON.parse(safeAnswerData.iterations)
          : (safeAnswerData.iterations as any)?.length 
            ? (safeAnswerData.iterations as any)
            : [];
      
      const transformedIterations = transformIterations(parsedIterations);
            
      setIterations(transformedIterations);
      setAnswerRecord({
        id: safeAnswerData.id,
        storyline_id: safeAnswerData.storyline_id,
        question_index: safeAnswerData.question_index,
        question: safeAnswerData.question,
        answer: safeAnswerData.answer,
        iterations: transformedIterations,
        type: safeAnswerData.type as 'technical' | 'behavioral' | undefined
      });
      
      setAnswer(safeAnswerData.answer || '');
    }
  };

  // Save answer to database
  const saveAnswer = async (answerText: string, feedback?: FeedbackData | null) => {
    if (!storylineId || !question) return;
    
    setIsSaving(true);
    
    try {
      const now = new Date().toISOString();
      let currentIterations = [...iterations];
      
      if (answerText.trim() !== '') {
        console.log('Creating new iteration with feedback:', feedback);
        const newIteration: AnswerIteration = { 
          answerText: answerText, 
          timestamp: now,
        };
        
        if (feedback) {
          newIteration.feedback = feedback;
        }
        
        currentIterations = [...currentIterations, newIteration];
        
        setIterations(currentIterations);
        console.log('Updated iterations with new entry:', currentIterations);
      }
      
      // Update existing record
      if (answerRecord?.id) {
        await updateExistingAnswer(answerRecord.id, answerText, currentIterations);
      } else {
        // Create a new record
        await createNewAnswer(answerText, currentIterations);
      }
      
      setAnswer(answerText);
      
      toast({
        title: "Success",
        description: "Your answer has been saved",
      });
    } catch (error) {
      console.error('Error saving answer:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save your answer",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Update an existing answer record
  const updateExistingAnswer = async (id: string, answerText: string, currentIterations: AnswerIteration[]) => {
    const { error } = await supabase
      .from('storyline_job_questions')
      .update({
        answer: answerText,
        iterations: JSON.stringify(currentIterations),
        updated_at: new Date().toISOString()
      })
      .eq('id', filterValue(id));
      
    if (error) throw error;
    
    setAnswerRecord({
      ...answerRecord!,
      answer: answerText,
      iterations: currentIterations
    });
  };

  // Create a new answer record
  const createNewAnswer = async (answerText: string, currentIterations: AnswerIteration[]) => {
    console.log('🪙 Deducting 1 token for creating a new question record');
    const tokenCheck = await deductTokens(1);
    
    if (!tokenCheck?.success) {
      toast({
        variant: "destructive",
        title: "Insufficient tokens",
        description: "You don't have enough tokens to save a new answer."
      });
      return;
    }
    
    const { data, error } = await supabase
      .from('storyline_job_questions')
      .insert({
        storyline_id: storylineId,
        question_index: questionIndex,
        question: question!.question,
        answer: answerText,
        iterations: currentIterations.length ? (currentIterations as unknown as Json) : [],
        type: question!.type
      })
      .select()
      .single();
      
    if (error) throw error;
    
    fetchTokens();
    
    if (data) {
      const safeData = safeDatabaseData(data);
      const parsedIterations: AnswerIteration[] = Array.isArray(safeData.iterations) 
        ? safeData.iterations 
        : typeof safeData.iterations === 'string' 
          ? JSON.parse(safeData.iterations)
          : (safeData.iterations as any)?.length 
            ? (safeData.iterations as any)
            : [];
      
      setIterations(parsedIterations);      
      setAnswerRecord({
        id: safeData.id,
        storyline_id: safeData.storyline_id,
        question_index: safeData.question_index,
        question: safeData.question,
        answer: safeData.answer,
        iterations: parsedIterations,
        type: safeData.type as 'technical' | 'behavioral' | undefined
      });
    }
  };

  return { 
    isLoading, 
    isSaving, 
    question, 
    answer, 
    answerRecord,
    iterations,
    setAnswer, 
    saveAnswer, 
    error 
  };
};
