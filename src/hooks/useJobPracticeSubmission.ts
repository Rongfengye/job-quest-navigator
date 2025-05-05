
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
  additionalDocumentsFile: FileData,
  behavioralId?: string // Optional parameter to link from behavioral interview
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
    
    // Skip token deduction if coming from a behavioral interview
    // since tokens were already deducted for the behavioral interview
    if (!behavioralId) {
      const tokenCheck = await deductTokens(5);
      if (!tokenCheck?.success) {
        return;
      }
      fetchTokens();
    }
    
    setIsLoading(true);
    setProcessingModal(true);
    
    try {
      // Only perform resume validation if not coming from behavioral
      if (!resumeFile.file && !behavioralId) {
        throw new Error("Resume file is required");
      }
      
      let resumePath = '';
      let coverLetterPath = null;
      let additionalDocumentsPath = null;
      
      // If coming from behavioral, get the resume path from the behavioral record
      if (behavioralId) {
        console.log("Getting resume from behavioral interview:", behavioralId);
        const { data: behavioralData, error: behavioralError } = await supabase
          .from('storyline_behaviorals')
          .select('resume_path, cover_letter_path, additional_documents_path, job_title, job_description, company_name, company_description')
          .eq('id', behavioralId)
          .single();
          
        if (behavioralError) {
          console.error("Error fetching behavioral data:", behavioralError);
          throw new Error(`Error retrieving behavioral interview data: ${behavioralError.message}`);
        }
        
        console.log("Behavioral data retrieved:", behavioralData);
        
        if (!behavioralData.resume_path) {
          throw new Error("No resume found in the behavioral interview data");
        }
        
        resumePath = behavioralData.resume_path;
        coverLetterPath = behavioralData.cover_letter_path;
        additionalDocumentsPath = behavioralData.additional_documents_path;
        
        // Use the data from behavioral interview if formData is empty
        if (!formData.jobTitle && behavioralData.job_title) {
          formData.jobTitle = behavioralData.job_title;
          formData.jobDescription = behavioralData.job_description;
          formData.companyName = behavioralData.company_name || '';
          formData.companyDescription = behavioralData.company_description || '';
        }
      } else {
        // Regular flow - upload files
        resumePath = await uploadFile(resumeFile.file!, 'resumes');
        
        if (coverLetterFile.file) {
          coverLetterPath = await uploadFile(coverLetterFile.file, 'cover-letters');
        }
        
        if (additionalDocumentsFile.file) {
          additionalDocumentsPath = await uploadFile(additionalDocumentsFile.file, 'additional-documents');
        }
      }

      console.log("Inserting job with user_id:", userId);
      console.log("Using resume path:", resumePath);
      console.log("Form data:", formData);
      
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
          user_id: userId,
          behavioral_id: behavioralId || null
        })
        .select('id')
        .single();

      if (insertError) {
        console.error("Insert error details:", insertError);
        throw new Error(`Error saving your application: ${insertError.message}`);
      }

      const storylineId = storylineData.id;
      console.log("Created storyline job with ID:", storylineId);

      // Prepare the request body for the OpenAI function
      const requestBody = {
        requestType: 'GENERATE_QUESTION',
        jobTitle: formData.jobTitle,
        jobDescription: formData.jobDescription,
        companyName: formData.companyName,
        companyDescription: formData.companyDescription,
        resumeText: resumeFile.text || '',
        coverLetterText: coverLetterFile.text || '',
        additionalDocumentsText: additionalDocumentsFile.text || '',
        resumePath: resumePath,
        coverLetterPath: coverLetterPath,
        additionalDocumentsPath: additionalDocumentsPath,
        behavioralId: behavioralId || null,
        generateFromBehavioral: !!behavioralId
      };

      console.log("Sending data to OpenAI function:");
      console.log("Resume path:", resumePath);
      console.log("Resume text length:", resumeFile.text?.length || 0);
      
      if (resumeFile.text) {
        console.log("Resume text preview:", resumeFile.text.substring(0, 200) + "...");
      }
      
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

      navigate(`/questions?id=${storylineId}`);

    } catch (error) {
      console.error('Error creating storyline job:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was an error creating your job practice. Please try again."
      });
      
      // Only refund tokens if we deducted them (not from behavioral)
      if (!behavioralId) {
        await deductTokens(-5);
        fetchTokens();
      }
    } finally {
      setIsLoading(false);
      setProcessingModal(false);
    }
  };

  return { isLoading, processingModal, submitJobPractice };
};
