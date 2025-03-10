
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Question } from '@/hooks/useQuestionData';

interface AnswerData {
  id?: string;
  storyline_id: string;
  question_index: number;
  question: string;
  answer: string | null;
  iterations: Array<{
    text: string;
    timestamp: string;
  }>;
  type?: 'technical' | 'behavioral' | 'experience';
}

export const useAnswers = (storylineId: string, questionIndex: number) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [answer, setAnswer] = useState<string>('');
  const [question, setQuestion] = useState<Question | null>(null);
  const [answerRecord, setAnswerRecord] = useState<AnswerData | null>(null);
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
          } else if (
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
        const { data: answerData, error: answerError } = await supabase
          .from('storyline_job_questions')
          .select('*')
          .eq('storyline_id', storylineId)
          .eq('question_index', questionIndex)
          .single();

        if (answerError && answerError.code !== 'PGRST116') { // Not found is ok
          throw answerError;
        }

        if (answerData) {
          setAnswerRecord(answerData);
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
    if (!storylineId || !question) return;
    
    setIsSaving(true);
    
    try {
      const now = new Date().toISOString();
      let iterations = answerRecord?.iterations || [];
      
      // Add the current answer as a new iteration if it's different from the last one
      if (answerText !== answer && answerText.trim() !== '') {
        iterations = [
          ...iterations,
          { text: answerText, timestamp: now }
        ];
      }
      
      // Check if we already have a record
      if (answerRecord) {
        // Update existing record
        const { error } = await supabase
          .from('storyline_job_questions')
          .update({
            answer: answerText,
            iterations,
            updated_at: now
          })
          .eq('id', answerRecord.id);
          
        if (error) throw error;
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('storyline_job_questions')
          .insert({
            storyline_id: storylineId,
            question_index: questionIndex,
            question: question.question,
            answer: answerText,
            iterations: iterations.length ? iterations : [],
            type: question.type
          })
          .select()
          .single();
          
        if (error) throw error;
        setAnswerRecord(data);
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
    iterations: answerRecord?.iterations || [],
    setAnswer, 
    saveAnswer, 
    error 
  };
};
