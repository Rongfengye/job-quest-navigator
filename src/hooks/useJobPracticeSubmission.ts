
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserTokens } from '@/hooks/useUserTokens';
import { v4 as uuidv4 } from 'uuid';

interface FormData {
  jobTitle: string;
  jobDescription: string;
  companyName: string;
  companyDescription: string;
}

interface FileData {
  file: File | null;
  text: string;
}

export const useJobPracticeSubmission = (
  userId: string | undefined,
  formData: FormData,
  resumeData: FileData,
  coverLetterData: FileData,
  additionalDocsData: FileData,
  behavioralId?: string | null
) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { deductTokens } = useUserTokens();
  const [isLoading, setIsLoading] = useState(false);
  const [processingModal, setProcessingModal] = useState(false);

  const submitJobPractice = async (behavioralIdParam?: string) => {
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to create a practice interview.",
      });
      return;
    }

    // Use the behavioralId from params if provided, otherwise use the one from props
    const finalBehavioralId = behavioralIdParam || behavioralId;

    // Check if user has enough tokens
    const tokenCheck = await deductTokens(5);
    if (!tokenCheck?.success) {
      toast({
        variant: "destructive",
        title: "Insufficient tokens",
        description: "You need at least 5 tokens to create a practice interview.",
      });
      return;
    }

    setIsLoading(true);
    setProcessingModal(true);

    try {
      // Generate a unique ID for the storyline
      const storylineId = uuidv4();

      // Create the storyline record
      const { error: insertError } = await supabase
        .from('storyline_jobs')
        .insert({
          id: storylineId,
          user_id: userId,
          job_title: formData.jobTitle,
          job_description: formData.jobDescription,
          company_name: formData.companyName,
          company_description: formData.companyDescription,
          behavioral_id: finalBehavioralId || null,
          status: 'processing',
          resume_path: resumeData.text ? 'resume.txt' : '' // Add the required resume_path field
        });

      if (insertError) throw insertError;

      // Upload resume if provided
      let resumePath = null;
      if (resumeData.file) {
        const resumeFileName = `${userId}/${storylineId}/resume-${resumeData.file.name}`;
        const { error: resumeError } = await supabase.storage
          .from('job-documents')
          .upload(resumeFileName, resumeData.file);

        if (resumeError) throw resumeError;
        resumePath = resumeFileName;
      }

      // Upload cover letter if provided
      let coverLetterPath = null;
      if (coverLetterData.file) {
        const coverLetterFileName = `${userId}/${storylineId}/cover-letter-${coverLetterData.file.name}`;
        const { error: coverLetterError } = await supabase.storage
          .from('job-documents')
          .upload(coverLetterFileName, coverLetterData.file);

        if (coverLetterError) throw coverLetterError;
        coverLetterPath = coverLetterFileName;
      }

      // Upload additional documents if provided
      let additionalDocsPath = null;
      if (additionalDocsData.file) {
        const additionalDocsFileName = `${userId}/${storylineId}/additional-docs-${additionalDocsData.file.name}`;
        const { error: additionalDocsError } = await supabase.storage
          .from('job-documents')
          .upload(additionalDocsFileName, additionalDocsData.file);

        if (additionalDocsError) throw additionalDocsError;
        additionalDocsPath = additionalDocsFileName;
      }

      // Update the storyline record with file paths
      const { error: updateError } = await supabase
        .from('storyline_jobs')
        .update({
          resume_path: resumePath || resumeData.text ? 'resume.txt' : '',
          cover_letter_path: coverLetterPath,
          additional_documents_path: additionalDocsPath
        })
        .eq('id', storylineId);

      if (updateError) throw updateError;

      // Call the Edge Function to generate questions
      const { error: functionError } = await supabase.functions.invoke('storyline-question-bank-prep', {
        body: {
          requestType: 'GENERATE_QUESTIONS',
          storylineId,
          jobTitle: formData.jobTitle,
          jobDescription: formData.jobDescription,
          companyName: formData.companyName,
          companyDescription: formData.companyDescription,
          resumeText: resumeData.text,
          coverLetterText: coverLetterData.text,
          additionalDocsText: additionalDocsData.text,
          behavioralId: finalBehavioralId || null
        },
      });

      if (functionError) throw functionError;

      // Dispatch a custom event that the job practice was created
      const event = new CustomEvent('jobPracticeCreated', {
        detail: { storylineId, behavioralId: finalBehavioralId }
      });
      window.dispatchEvent(event);

      // Navigate to the questions page with both IDs if behavioralId is provided
      if (finalBehavioralId) {
        navigate(`/questions?id=${storylineId}&behavioralId=${finalBehavioralId}`);
      } else {
        navigate(`/questions?id=${storylineId}`);
      }

      toast({
        title: "Success!",
        description: "Your practice interview is being prepared.",
      });
    } catch (error) {
      console.error('Error creating practice interview:', error);
      
      // Refund tokens on error
      await deductTokens(-5);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create practice interview. Please try again.",
      });
    } finally {
      setIsLoading(false);
      setProcessingModal(false);
    }
  };

  return {
    isLoading,
    processingModal,
    submitJobPractice
  };
};
