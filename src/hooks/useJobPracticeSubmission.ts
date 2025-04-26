import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserTokens } from '@/hooks/useUserTokens';
import { uploadFile } from './useFileUpload';

interface FileData {
  file: File | null;
  text: string;
}

interface FormData {
  jobTitle: string;
  jobDescription: string;
  companyName: string;
  companyDescription: string;
}

export const useJobPracticeSubmission = (
  userId: string | undefined,
  formData: FormData,
  resumeFile: FileData,
  coverLetterFile: FileData,
  additionalDocumentsFile: FileData
) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { deductTokens, fetchTokens } = useUserTokens();
  const [isLoading, setIsLoading] = useState(false);
  const [processingModal, setProcessingModal] = useState(false);

  const submitJobPractice = async () => {
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to create a job practice."
      });
      return;
    }
    
    const tokenCheck = await deductTokens(5);
    if (!tokenCheck?.success) {
      return;
    }
    
    fetchTokens();
    setIsLoading(true);
    setProcessingModal(true);
    
    try {
      if (!resumeFile.file) {
        throw new Error("Resume file is required");
      }
      
      const resumePath = await uploadFile(resumeFile.file, 'resumes');
      let coverLetterPath = null;
      let additionalDocumentsPath = null;
      
      if (coverLetterFile.file) {
        coverLetterPath = await uploadFile(coverLetterFile.file, 'cover-letters');
      }
      
      if (additionalDocumentsFile.file) {
        additionalDocumentsPath = await uploadFile(additionalDocumentsFile.file, 'additional-documents');
      }

      console.log("Inserting job with user_id:", userId);
      const { data: storylineData, error: insertError } = await supabase
        .from('storyline_jobs')
        .insert({
          job_title: formData.jobTitle,
          job_description: formData.jobDescription,
          company_name: formData.companyName,
          company_description: formData.companyDescription,
          resume_path: resumePath,
          cover_letter_path: coverLetterPath,
          additional_documents_path: additionalDocumentsPath,
          status: 'processing',
          user_id: userId
        })
        .select('id')
        .single();

      if (insertError) {
        console.error("Insert error details:", insertError);
        throw new Error(`Error saving your application: ${insertError.message}`);
      }

      const storylineId = storylineData.id;

      const requestBody = {
        requestType: 'GENERATE_QUESTION',
        jobTitle: formData.jobTitle,
        jobDescription: formData.jobDescription,
        companyName: formData.companyName,
        companyDescription: formData.companyDescription,
        resumeText: resumeFile.text,
        coverLetterText: coverLetterFile.text,
        additionalDocumentsText: additionalDocumentsFile.text,
        resumePath: resumePath,
        coverLetterPath: coverLetterPath,
        additionalDocumentsPath: additionalDocumentsPath,
      };

      console.log("Sending data to OpenAI function:");
      console.log("Resume text length:", resumeFile.text?.length || 0);
      console.log("Resume text preview:", resumeFile.text?.substring(0, 200) + "...");
      console.log("Cover letter text length:", coverLetterFile.text?.length || 0);
      console.log("Additional documents text length:", additionalDocumentsFile.text?.length || 0);

      const { data, error } = await supabase.functions.invoke('storyline-question-bank-prep', {
        body: requestBody,
      });

      if (error) {
        throw new Error(`Error processing your application: ${error.message}`);
      }

      console.log("Received response from OpenAI function:", data ? "Success" : "No data");

      const { error: updateError } = await supabase
        .from('storyline_jobs')
        .update({
          openai_response: data,
          status: 'completed'
        })
        .eq('id', storylineId);

      if (updateError) {
        throw new Error(`Error updating your application: ${updateError.message}`);
      }

      toast({
        title: "Success!",
        description: "Your interview questions have been generated. Redirecting to results page.",
      });

      setProcessingModal(false);
      navigate(`/questions?id=${storylineId}`);

    } catch (error) {
      console.error('Error creating storyline job:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was an error creating your job practice. Please try again."
      });
      await deductTokens(-5);
      fetchTokens();
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, processingModal, submitJobPractice };
};
