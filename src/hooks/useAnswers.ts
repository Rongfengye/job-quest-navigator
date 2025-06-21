import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Answer {
  id: string;
  question: string;
  answer: string;
  feedback?: string;
  created_at: string;
  storyline_id: string;
  type?: string;
}

interface StorylineJob {
  id: string;
  job_title: string;
  company_name: string | null;
  created_at: string;
  openai_response: any;
}

// Type guard to safely convert Json to string
const toString = (jsonValue: any): string => {
  if (typeof jsonValue === 'string') return jsonValue;
  if (typeof jsonValue === 'number') return String(jsonValue);
  if (typeof jsonValue === 'boolean') return String(jsonValue);
  return '';
};

export const useAnswers = () => {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [storylines, setStorylines] = useState<StorylineJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchAnswers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('storyline_job_questions')
        .select(`
          id,
          question,
          answer,
          created_at,
          storyline_id,
          type,
          iterations
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedAnswers = data?.map((item) => {
        // Handle the iterations field which could be a JSON array
        let feedback;
        if (item.iterations && Array.isArray(item.iterations) && item.iterations.length > 0) {
          const latestIteration = item.iterations[item.iterations.length - 1];
          feedback = latestIteration?.feedback || undefined;
        }

        return {
          id: item.id,
          question: toString(item.question),
          answer: toString(item.answer || ''),
          feedback,
          created_at: item.created_at,
          storyline_id: item.storyline_id,
          type: item.type || undefined
        };
      }) || [];

      setAnswers(processedAnswers);
    } catch (error) {
      console.error('Error fetching answers:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your answers. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStorylines = async () => {
    try {
      const { data, error } = await supabase
        .from('storyline_jobs')
        .select('id, job_title, company_name, created_at, openai_response')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStorylines(data || []);
    } catch (error) {
      console.error('Error fetching storylines:', error);
    }
  };

  const deleteAnswer = async (answerId: string) => {
    try {
      const { error } = await supabase
        .from('storyline_job_questions')
        .delete()
        .eq('id', answerId);

      if (error) throw error;

      setAnswers(prev => prev.filter(answer => answer.id !== answerId));
      
      toast({
        title: "Answer deleted",
        description: "The answer has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting answer:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete the answer. Please try again.",
      });
    }
  };

  useEffect(() => {
    fetchAnswers();
    fetchStorylines();
  }, []);

  return {
    answers,
    storylines,
    isLoading,
    refetch: fetchAnswers,
    deleteAnswer
  };
};
