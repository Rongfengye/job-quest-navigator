
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Question } from '@/hooks/useQuestionData';
import { Json } from '@/integrations/supabase/types';
import { useUserTokens } from '@/hooks/useUserTokens';
import { FeedbackData } from '@/hooks/useAnswerFeedback';
import { filterValue, safeDatabaseData } from '@/utils/supabaseTypes';

// Define the AnswerIteration interface to be compatible with Json type
export interface AnswerIteration {
  answerText: string; // Changed from 'text' to 'answerText'
  timestamp: string;
  feedback?: {
    pros: string[];
    cons: string[];
    guidelines: string;
    improvementSuggestions: string;
    score: number;
  };
  [key: string]: any; // Add index signature to make it compatible with Json
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

  // Fetch the question and any existing answer
  useEffect(() => {
    const fetchQuestionAndAnswer = async () => {
      if (!storylineId) {
        setIsLoading(false);
        return;
      }

      try {
        // First get the storyline to fetch the question
        const { data: storylineData, error: storylineError } = await supabase
          .from('storyline_jobs')
          .select('openai_response')
          .eq('id', filterValue(storylineId))
          .single();

        console.log('THIS IS THE STORYLINE_DATA', storylineData)

        if (storylineError) throw storylineError;

        if (storylineData?.openai_response) {
          const safeData = safeDatabaseData(storylineData);
          let parsedResponse;
          if (typeof safeData.openai_response === 'string') {
            parsedResponse = JSON.parse(safeData.openai_response);
          } else {
            parsedResponse = safeData.openai_response;
          }

          let questions: Question[] = [];
          
          if (parsedResponse.questions) {
            questions = parsedResponse.questions;
          } else if (
            parsedResponse.technicalQuestions && 
            parsedResponse.behavioralQuestions
          ) {
            const technical = parsedResponse.technicalQuestions.map((q: any) => ({
              ...q, type: 'technical' as const
            }));
            
            const behavioral = parsedResponse.behavioralQuestions.map((q: any) => ({
              ...q, type: 'behavioral' as const
            }));
            
            questions = [...technical, ...behavioral];
          }

          if (questions && questions.length > questionIndex) {
            setQuestion(questions[questionIndex]);
          }
        }

        // Look for an existing answer in the storyline_job_questions table
        console.log('BEFORE MAKING THE storyline job questions to grab initial question information', storylineId, questionIndex)
        const { data: answerData, error: answerError } = await supabase
          .from('storyline_job_questions')
          .select('*')
          .eq('storyline_id', filterValue(storylineId))
          .eq('question_index', filterValue(questionIndex))
          .single();

        console.log('THIS IS THE STORY QUESTIONS CALL RESPONSE', answerData, answerError)
        if (answerError && answerError.code !== 'PGRST116') { // Not found is ok
          throw answerError;
        }

        if (answerData) {
          const safeAnswerData = safeDatabaseData(answerData);
          // Parse iterations properly
          console.log('IN THE ANSWER DATA', safeAnswerData)
          const parsedIterations: AnswerIteration[] = Array.isArray(safeAnswerData.iterations) 
            ? safeAnswerData.iterations 
            : typeof safeAnswerData.iterations === 'string' 
              ? JSON.parse(safeAnswerData.iterations)
              : (safeAnswerData.iterations as any)?.length 
                ? (safeAnswerData.iterations as any)
                : [];
          
          // Transform old format iterations to new format if needed
          const transformedIterations = parsedIterations.map((iteration: any) => {
            if (iteration.text && !iteration.answerText) {
              // Convert old format to new format
              return {
                answerText: iteration.text,
                timestamp: iteration.timestamp,
                ...(iteration.feedback ? { feedback: iteration.feedback } : {})
              };
            }
            return iteration;
          });
                
          // Update both state values
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

  // Save the answer with optional feedback
  const saveAnswer = async (answerText: string, feedback?: FeedbackData | null) => {
    console.log('in the save ANSWER', storylineId, question)
    if (!storylineId || !question) return;
    
    setIsSaving(true);
    
    try {
      const now = new Date().toISOString();
      // Get the latest iterations directly from state
      let currentIterations = [...iterations];
      
      // Add the current answer as a new iteration with the new structure
      if (answerText.trim() !== '') {
        console.log('Creating new iteration with feedback:', feedback);
        const newIteration: AnswerIteration = { 
          answerText: answerText, 
          timestamp: now,
        };
        
        // Add feedback if available
        if (feedback) {
          newIteration.feedback = feedback;
        }
        
        currentIterations = [...currentIterations, newIteration];
        
        // Update state immediately to ensure UI reflects changes
        setIterations(currentIterations);
        console.log('Updated iterations with new entry:', currentIterations);
      }
      
      // Check if we already have a record
      if (answerRecord?.id) {
        // Update existing record
        const { error } = await supabase
          .from('storyline_job_questions')
          .update({
            answer: answerText,
            iterations: JSON.stringify(currentIterations),
            updated_at: new Date().toISOString()
          })
          .eq('id', filterValue(answerRecord.id));
          
        if (error) throw error;
        
        // Update local state with the new data
        setAnswerRecord({
          ...answerRecord,
          answer: answerText,
          iterations: currentIterations
        });
      } else {
        // New record being created
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
        
        // Create new record
        const { data, error } = await supabase
          .from('storyline_job_questions')
          .insert({
            storyline_id: storylineId,
            question_index: questionIndex,
            question: question.question,
            answer: answerText,
            iterations: currentIterations.length ? (currentIterations as unknown as Json) : [],
            type: question.type
          })
          .select()
          .single();
          
        if (error) throw error;
        
        // Update token display after successful deduction
        fetchTokens();
        
        if (data) {
          const safeData = safeDatabaseData(data);
          // Parse iterations properly
          const parsedIterations: AnswerIteration[] = Array.isArray(safeData.iterations) 
            ? safeData.iterations 
            : typeof safeData.iterations === 'string' 
              ? JSON.parse(safeData.iterations)
              : (safeData.iterations as any)?.length 
                ? (safeData.iterations as any)
                : [];
          
          // Update both state variables
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

  return { 
    isLoading, 
    isSaving, 
    question, 
    answer, 
    answerRecord,
    iterations, // Return iterations directly from state
    setAnswer, 
    saveAnswer, 
    error 
  };
};
