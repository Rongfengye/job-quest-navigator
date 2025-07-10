
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Json } from '@/integrations/supabase/types';
import { filterValue, safeDatabaseData } from '@/utils/supabaseTypes';

// Feature flag to control technical questions processing (matches backend and frontend)
const ENABLE_TECHNICAL_QUESTIONS = false;

export type Question = {
  question: string;
  explanation?: string;
  modelAnswer?: string;
  followUp?: string[];
  type?: 'technical' | 'behavioral' | 'original-behavioral';
  originalIndex?: number;
};

export type ParsedResponse = {
  technicalQuestions?: Question[];
  behavioralQuestions?: Question[];
  originalBehavioralQuestions?: Question[];
  questions?: Question[];
};

export type JobDetails = {
  jobTitle: string;
  companyName: string;
  behavioralId?: string | null;
};

// Function to categorize a question by keywords in the text
export const categorizeQuestion = (questionText: string): 'technical' | 'behavioral' => {
  const lowerQuestion = questionText.toLowerCase();
  
  if (lowerQuestion.includes('technical') || 
      lowerQuestion.includes('tool') || 
      lowerQuestion.includes('technology') || 
      lowerQuestion.includes('gcp') ||
      lowerQuestion.includes('design') ||
      lowerQuestion.includes('implement') ||
      lowerQuestion.includes('skill')) {
    return 'technical';
  } else {
    return 'behavioral';
  }
};

// Parse JSON safely
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
    behavioralId: null,
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
          behavioralId: safeData.behavioral_id,
        });

        if (safeData.openai_response) {
          console.log("OpenAI response from database:", safeData.openai_response);
          
          let processedQuestions: Question[] = [];
          const parsedResponse = safeJsonParse(safeData.openai_response);
          
          // Handle format with separate question categories including original behavioral questions
          if (parsedResponse.technicalQuestions && Array.isArray(parsedResponse.technicalQuestions) && 
              parsedResponse.behavioralQuestions && Array.isArray(parsedResponse.behavioralQuestions)) {
            
            // Only process technical questions if feature flag is enabled
            const technical = ENABLE_TECHNICAL_QUESTIONS 
              ? parsedResponse.technicalQuestions.map(q => ({
                  ...q, 
                  type: 'technical' as const
                }))
              : [];
              
            const behavioral = parsedResponse.behavioralQuestions.map(q => ({
              ...q, 
              type: 'behavioral' as const
            }));

            // Add original behavioral questions if they exist
            const originalBehavioral = parsedResponse.originalBehavioralQuestions 
              ? parsedResponse.originalBehavioralQuestions.map(q => ({
                  ...q,
                  type: 'original-behavioral' as const
                }))
              : [];
            
            processedQuestions = [...technical, ...behavioral, ...originalBehavioral];
          } 
          // Handle format with a single questions array
          else if (parsedResponse.questions && Array.isArray(parsedResponse.questions)) {
            processedQuestions = parsedResponse.questions
              .map(q => ({
                ...q,
                type: q.type || categorizeQuestion(q.question)
              }))
              // Filter out technical questions if feature flag is disabled
              .filter(q => ENABLE_TECHNICAL_QUESTIONS || q.type !== 'technical');
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
