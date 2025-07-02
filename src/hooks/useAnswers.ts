import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Question } from '@/hooks/useQuestionData';
import { Json } from '@/integrations/supabase/types';
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [answer, setAnswer] = useState<string>('');
  const [question, setQuestion] = useState<Question | null>(null);
  const [answerRecord, setAnswerRecord] = useState<AnswerData | null>(null);
  const [iterations, setIterations] = useState<AnswerIteration[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch question data from storyline_jobs
  const fetchQuestionData = async (): Promise<Question | null> => {
    const { data: storylineData, error: storylineError } = await supabase
      .from('storyline_jobs')
      .select('openai_response')
      .eq('id', filterValue(storylineId))
      .single();

    if (storylineError) {
      console.error('Error fetching storyline data:', storylineError);
      setError("Failed to load question data.");
      return null;
    }

    if (storylineData?.openai_response) {
      const parsedResponse =
        typeof storylineData.openai_response === 'string'
          ? JSON.parse(storylineData.openai_response)
          : storylineData.openai_response;
      const questions = parseOpenAIResponse(parsedResponse);

      if (questions && questions.length > questionIndex) {
        const questionData = questions[questionIndex];
        setQuestion(questionData);
        return questionData;
      }
    }
    return null;
  };

  // Fetch answer data from storyline_job_questions
  const fetchAnswerData = async (questionData?: Question | null) => {
    const { data: answerData, error: answerError } = await supabase
      .from('storyline_job_questions')
      .select('*')
      .eq('storyline_id', filterValue(storylineId))
      .eq('question_index', questionIndex)
      .single();

    if (answerError && answerError.code !== 'PGRST116') { // Ignore no rows found error
      console.error('Error fetching answer data:', answerError);
      setError('Failed to load answer data.');
      return;
    }

    const currentQuestion = questionData || question;
    if (!answerData && currentQuestion?.type === 'original-behavioral') {
      const { data: storylineJob, error: storylineError } = await supabase
        .from('storyline_jobs')
        .select('behavioral_id')
        .eq('id', filterValue(storylineId))
        .single();

      if (!storylineError && storylineJob?.behavioral_id) {
        const behavioralQuestionIndex = questionIndex - 10;
        
        if (behavioralQuestionIndex >= 0 && behavioralQuestionIndex <= 4) {
          const behavioralIterations = await fetchBehavioralData(
            storylineJob.behavioral_id, 
            behavioralQuestionIndex
          );
          
          if (behavioralIterations && behavioralIterations.length > 0) {
            setIterations(behavioralIterations);
            setAnswer(behavioralIterations[0].answerText);
            console.log('Preloaded behavioral data:', behavioralIterations);
            return;
          }
        }
      }
    }

    if (answerData) {
      const safeAnswerData = safeDatabaseData(answerData);
      const parsedIterations: AnswerIteration[] = Array.isArray(safeAnswerData.iterations) 
        ? safeAnswerData.iterations as unknown as AnswerIteration[]
        : typeof safeAnswerData.iterations === 'string' 
          ? JSON.parse(safeAnswerData.iterations)
          : [];

      setIterations(parsedIterations);
      setAnswer(safeAnswerData.answer || '');
      setAnswerRecord(safeAnswerData as unknown as AnswerData);
    }
  };

  // Fetch question and answer data on initial load
  useEffect(() => {
    const fetchAllData = async () => {
      if (!storylineId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const questionData = await fetchQuestionData();
        await fetchAnswerData(questionData);
      } catch (error) {
        console.error('Error fetching question and answer:', error);
        setError(error instanceof Error ? error.message : "Failed to load question");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAllData();
  }, [storylineId, questionIndex]);

  // Transform behavioral data to answer iteration format
  const transformBehavioralDataToIteration = (response: string, feedback: any, timestamp: string): AnswerIteration => {
    return {
      answerText: response,
      timestamp: timestamp,
      feedback: {
        pros: feedback.pros || [],
        cons: feedback.cons || [],
        guidelines: feedback.guidelines || '',
        improvementSuggestions: feedback.improvementSuggestions || '',
        score: feedback.score || 0
      }
    };
  };

  // Fetch behavioral interview data for original behavioral questions
  const fetchBehavioralData = async (behavioralId: string, behavioralQuestionIndex: number) => {
    const { data: behavioralData, error: behavioralError } = await supabase
      .from('storyline_behaviorals')
      .select('responses, feedback, created_at')
      .eq('id', filterValue(behavioralId))
      .single();

    if (behavioralError) {
      console.error('Error fetching behavioral data:', behavioralError);
      return null;
    }

    if (behavioralData) {
      const safeData = safeDatabaseData(behavioralData);
      const responses = Array.isArray(safeData.responses) ? safeData.responses : [];
      const feedbackArray = Array.isArray(safeData.feedback) ? safeData.feedback : [];
      
      if (responses[behavioralQuestionIndex] && feedbackArray[behavioralQuestionIndex]) {
        const iteration = transformBehavioralDataToIteration(
          responses[behavioralQuestionIndex] as string,
          feedbackArray[behavioralQuestionIndex],
          safeData.created_at || new Date().toISOString()
        );
        return [iteration];
      }
    }
    
    return [];
  };

  const saveAnswer = async (answerText: string, feedbackData: FeedbackData | null) => {
    if (!question) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Question not loaded yet.",
      });
      return;
    }
  
    setIsSaving(true);
    setError(null);
  
    const newIteration: AnswerIteration = {
      answerText,
      timestamp: new Date().toISOString(),
      feedback: feedbackData || undefined,
    };
  
    const updatedIterations = [...iterations, newIteration];
    setIterations(updatedIterations);
    setAnswer(answerText);
  
    try {
      if (answerRecord && answerRecord.id) {
        await updateExistingAnswer(answerRecord.id, answerText, updatedIterations);
      } else {
        await createNewAnswer(answerText, updatedIterations);
      }
      toast({
        title: "Success",
        description: "Your answer has been saved.",
      });
    } catch (error) {
      console.error('Error saving answer:', error);
      setError(error instanceof Error ? error.message : 'Failed to save answer');
      setIterations(iterations); // Revert to old iterations on error
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save your answer. Please try again.",
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
        iterations: currentIterations as unknown as Json,
      })
      .eq('id', filterValue(id));
  
    if (error) throw error;
  };

  // Create a new answer record
  const createNewAnswer = async (answerText: string, currentIterations: AnswerIteration[]) => {
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