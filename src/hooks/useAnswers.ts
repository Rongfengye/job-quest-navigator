
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Question } from '@/components/questions/QuestionCard';

interface AnswerData {
  id?: string;
  storyline_id: string;
  question_index: number;
  answer_text: string;
  created_at?: string;
  updated_at?: string;
}

export const useAnswers = (storylineId: string, questionIndex: number) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [answer, setAnswer] = useState<string>('');
  const [question, setQuestion] = useState<Question | null>(null);
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

        // Now look for an existing answer
        // Note: In a real implementation, you would create an 'answers' table in your database
        // For now, we'll just use local storage as a simple example
        const savedAnswer = localStorage.getItem(`answer-${storylineId}-${questionIndex}`);
        if (savedAnswer) {
          setAnswer(savedAnswer);
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
    if (!storylineId) return;
    
    setIsSaving(true);
    
    try {
      // For now, we'll use local storage
      // In a real implementation, you would save this to your database
      localStorage.setItem(`answer-${storylineId}-${questionIndex}`, answerText);
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
    setAnswer, 
    saveAnswer, 
    error 
  };
};
