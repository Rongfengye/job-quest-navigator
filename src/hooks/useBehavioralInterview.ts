
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FormData {
  jobTitle: string;
  jobDescription: string;
  companyName: string;
  companyDescription: string;
}

export const useBehavioralInterview = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const generateQuestion = async (
    formData: FormData,
    resumeText: string,
    coverLetterText: string,
    additionalDocumentsText: string,
    resumePath: string,
    coverLetterPath: string,
    additionalDocumentsPath: string,
    behavioralId: string,
    userId?: string
  ) => {
    setIsLoading(true);

    try {
      const requestBody = {
        jobTitle: formData.jobTitle,
        jobDescription: formData.jobDescription,
        companyName: formData.companyName,
        companyDescription: formData.companyDescription,
        resumeText,
        coverLetterText,
        additionalDocumentsText,
        previousQuestions: [],
        previousAnswers: [],
        questionIndex: 0,
        generateFeedback: false,
        generateAudio: true,
        voice: 'alloy',
        userId: userId,
        isFirstQuestion: true // Flag to indicate this is the first question (for usage tracking)
      };

      const { data, error } = await supabase.functions.invoke('storyline-create-behavioral-interview', {
        body: requestBody
      });

      if (error) {
        // Handle usage limit errors specifically
        if (error.message?.includes('Usage limit exceeded') || error.message?.includes('429')) {
          toast({
            variant: "destructive",
            title: "Monthly Limit Reached",
            description: "You've reached your monthly limit for behavioral interviews. Upgrade to premium for unlimited access."
          });
          return null;
        }
        
        throw new Error(error.message);
      }

      // Check if the response contains usage limit error
      if (data?.error === 'Usage limit exceeded') {
        toast({
          variant: "destructive",
          title: "Monthly Limit Reached",
          description: data.message || "You've reached your monthly limit for behavioral interviews."
        });
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error generating question:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate question"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generateQuestion,
    isLoading
  };
};
