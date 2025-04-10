import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Json } from '@/integrations/supabase/types';
import { filterValue, safeDatabaseData } from '@/utils/supabaseTypes';

export type Question = {
  question: string;
  explanation?: string;
  modelAnswer?: string;
  followUp?: string[];
  type?: 'technical' | 'behavioral' | 'experience';
};

export type ParsedResponse = {
  technicalQuestions?: Question[];
  behavioralQuestions?: Question[];
  experienceQuestions?: Question[];
  questions?: Question[];
};

export type JobDetails = {
  jobTitle: string;
  companyName: string;
};

export const categorizeQuestion = (questionText: string): 'technical' | 'behavioral' | 'experience' => {
  const lowerQuestion = questionText.toLowerCase();
  
  if (lowerQuestion.includes('technical') || 
      lowerQuestion.includes('tool') || 
      lowerQuestion.includes('technology') || 
      lowerQuestion.includes('gcp') ||
      lowerQuestion.includes('design') ||
      lowerQuestion.includes('skill')) {
    return 'technical';
  } else if (lowerQuestion.includes('experience') || 
            lowerQuestion.includes('previous') || 
            lowerQuestion.includes('worked') ||
            lowerQuestion.includes('implement')) {
    return 'experience';
  } else {
    return 'behavioral';
  }
};

export const safeJsonParse = (data: Json): ParsedResponse => {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as ParsedResponse;
    } catch (e) {
      console.error('Failed to parse JSON string:', e);
      return {};
    }
  } else if (typeof data === 'object' && data !== null) {
    return data as unknown as ParsedResponse;
  }
  
  return {};
};

export const useQuestionData = (storylineId: string | null) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [jobDetails, setJobDetails] = useState<JobDetails>({
    jobTitle: '',
    companyName: '',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!storylineId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No storyline ID provided. Please go back and try again.",
        });
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('storyline_jobs')
          .select('*')
          .eq('id', filterValue(storylineId))
          .single();

        if (error) throw error;

        if (!data) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "No data found for this interview preparation.",
          });
          setIsLoading(false);
          return;
        }

        console.log("Storyline data retrieved:", data);
        
        const safeData = safeDatabaseData(data);

        setJobDetails({
          jobTitle: safeData.job_title || 'Untitled Position',
          companyName: safeData.company_name,
        });

        if (safeData.openai_response) {
          console.log("OpenAI response from database:", safeData.openai_response);
          
          let processedQuestions: Question[] = [];
          const parsedResponse = safeJsonParse(safeData.openai_response);
          
          if (parsedResponse.technicalQuestions && Array.isArray(parsedResponse.technicalQuestions) && 
              parsedResponse.behavioralQuestions && Array.isArray(parsedResponse.behavioralQuestions) && 
              parsedResponse.experienceQuestions && Array.isArray(parsedResponse.experienceQuestions)) {
            
            const technical = parsedResponse.technicalQuestions.map(q => ({
              ...q, 
              type: 'technical' as const
            }));
              
            const behavioral = parsedResponse.behavioralQuestions.map(q => ({
              ...q, 
              type: 'behavioral' as const
            }));
              
            const experience = parsedResponse.experienceQuestions.map(q => ({
              ...q, 
              type: 'experience' as const
            }));
            
            processedQuestions = [...technical, ...behavioral, ...experience];
          } 
          else if (parsedResponse.questions && Array.isArray(parsedResponse.questions)) {
            processedQuestions = parsedResponse.questions.map(q => ({
              ...q,
              type: q.type || categorizeQuestion(q.question)
            }));
          }
          
          setQuestions(processedQuestions);
        } else {
          toast({
            variant: "destructive",
            title: "Processing",
            description: "Your interview questions are still being generated. Please check back later.",
          });
        }
      } catch (error) {
        console.error('Error fetching questions:', error);
        setError(error instanceof Error ? error.message : "Failed to load interview questions");
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load interview questions",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [storylineId, toast]);

  return { isLoading, questions, jobDetails, error };
};
