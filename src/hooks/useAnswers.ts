
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Question } from '@/hooks/useQuestionData';
import { Json } from '@/integrations/supabase/types';
import { useUserTokens } from '@/hooks/useUserTokens';

// Define the AnswerIteration interface to be compatible with Json type
export interface AnswerIteration {
  text: string;
  timestamp: string;
  [key: string]: string; // Add index signature to make it compatible with Json
}

interface AnswerData {
  id?: string;
  storyline_id: string;
  question_index: number;
  question: string;
  answer: string | null;
  iterations: AnswerIteration[];
  type?: 'technical' | 'behavioral' | 'experience';
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
          .eq('id', storylineId)
          .single();

        console.log('THIS IS THE STORYLINE_DATA', storylineData)

        if (storylineError) throw storylineError;

        if (storylineData?.openai_response) {
          let parsedResponse;
          if (typeof storylineData.openai_response === 'string') {
            parsedResponse = JSON.parse(storylineData.openai_response);
          } else {
            parsedResponse = storylineData.openai_response;
          }

          let questions: Question[] = [];
          
          if (parsedResponse.questions) {
            questions = parsedResponse.questions;
          } else if ( /* DO NOT ERASE: later on we would probably need to figure out this typing */
            parsedResponse.technicalQuestions && 
            parsedResponse.behavioralQuestions && 
            parsedResponse.experienceQuestions
          ) {
            const technical = parsedResponse.technicalQuestions.map((q: any) => ({
              ...q, type: 'technical' as const
            }));
            
            const behavioral = parsedResponse.behavioralQuestions.map((q: any) => ({
              ...q, type: 'behavioral' as const
            }));
            
            const experience = parsedResponse.experienceQuestions.map((q: any) => ({
              ...q, type: 'experience' as const
            }));
            
            questions = [...technical, ...behavioral, ...experience];
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
          .eq('storyline_id', storylineId)
          .eq('question_index', questionIndex)
          .single();

        console.log('THIS IS THE STORY QUESTIONS CALL RESPONSE', answerData, answerError)
        if (answerError && answerError.code !== 'PGRST116') { // Not found is ok
          throw answerError;
        }

        if (answerData) {
          // Parse iterations properly
          console.log('IN THE ANSWER DATA', answerData)
          const parsedIterations: AnswerIteration[] = Array.isArray(answerData.iterations) 
            ? answerData.iterations 
            : typeof answerData.iterations === 'string' 
              ? JSON.parse(answerData.iterations)
              : (answerData.iterations as any)?.length 
                ? (answerData.iterations as any)
                : [];
                
          // Update both state values
          setIterations(parsedIterations);
          setAnswerRecord({
            id: answerData.id,
            storyline_id: answerData.storyline_id,
            question_index: answerData.question_index,
            question: answerData.question,
            answer: answerData.answer,
            iterations: parsedIterations,
            type: answerData.type as 'technical' | 'behavioral' | 'experience' | undefined
          });
          
          setAnswer(answerData.answer || '');
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

  // Save the answer
  const saveAnswer = async (answerText: string) => {
    console.log('in the save ANSWER', storylineId, question)
    if (!storylineId || !question) return;
    
    setIsSaving(true);
    
    try {
      const now = new Date().toISOString();
      // Get the latest iterations directly from state
      let currentIterations = [...iterations];
      
      // Add the current answer as a new iteration if it's different from the last one
      console.log('This is the iterations object beforehand', currentIterations);
      if (answerText !== answer && answerText.trim() !== '') {
        console.log('in the if statement');
        const newIteration = { text: answerText, timestamp: now };
        currentIterations = [...currentIterations, newIteration];
        
        // Update state immediately to ensure UI reflects changes
        setIterations(currentIterations);
        console.log('Updated iterations with new entry:', currentIterations);
      }
      
      // Check if we already have a record
      if (answerRecord) {
        // Update existing record
        const { error } = await supabase
          .from('storyline_job_questions')
          .update({
            answer: answerText,
            iterations: JSON.stringify(currentIterations),
            updated_at: new Date().toISOString()
          })
          .eq('id', answerRecord.id);
          
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
          // Parse iterations properly
          const parsedIterations: AnswerIteration[] = Array.isArray(data.iterations) 
            ? data.iterations 
            : typeof data.iterations === 'string' 
              ? JSON.parse(data.iterations)
              : (data.iterations as any)?.length 
                ? (data.iterations as any)
                : [];
          
          // Update both state variables
          setIterations(parsedIterations);      
          setAnswerRecord({
            id: data.id,
            storyline_id: data.storyline_id,
            question_index: data.question_index,
            question: data.question,
            answer: data.answer,
            iterations: parsedIterations,
            type: data.type as 'technical' | 'behavioral' | 'experience' | undefined
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
