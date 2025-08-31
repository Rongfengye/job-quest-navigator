
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
  behavioralId?: string, // Optional parameter to link from behavioral interview
  originalBehavioralQuestions?: string[], // New parameter for original questions
  skipGeneration?: boolean // New parameter to skip question generation for entry point B
) => {
  const { toast } = useToast();
  const navigate = useNavigate();
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
        const { data: behavioralData, error: behavioralError } = await supabase
          .from('storyline_behaviorals')
          .select('resume_path, cover_letter_path, additional_documents_path, job_title, job_description, company_name, company_description')
          .eq('id', behavioralId)
          .single();
          
        if (behavioralError) {
          throw new Error(`Error retrieving behavioral interview data: ${behavioralError.message}`);
        }
        
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
        throw new Error(`Error saving your application: ${insertError.message}`);
      }

      const storylineId = storylineData.id;

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
        generateFromBehavioral: !!behavioralId,
        originalBehavioralQuestions: originalBehavioralQuestions || [], // Pass original questions
        skipGeneration: skipGeneration || false, // Add skipGeneration flag
        userId: userId // Add userId for usage tracking
      };

      const { data, error } = await supabase.functions.invoke('storyline-question-vault-prep', {
        body: requestBody,
      });

      if (error) {
        // Handle usage limit errors - don't block, let soft gate handle it
        if (error.message?.includes('Usage limit exceeded') || error.message?.includes('429')) {
          // Let the UI components handle the soft gate display
          console.log('Usage limit reached, letting soft gate handle it');
          return;
        }
        
        // Phase 3: Handle specific skipGeneration errors
        if (error.message?.includes('Behavioral interview data not found')) {
          console.log('Behavioral interview data not found, will handle in UI');
          throw new Error('Behavioral interview data not found - returnToFeedback');
        }
        
        if (error.message?.includes('No original questions available')) {
          console.log('No original questions available, suggesting Create page');
          throw new Error('No original questions available - suggestCreatePage');
        }
        
        throw new Error(`Error processing your application: ${error.message}`);
      }

      // Check if the response contains usage limit error - don't block
      if (data?.error === 'Usage limit exceeded') {
        // Let the UI components handle the soft gate display
        console.log('Usage limit reached, letting soft gate handle it');
        return;
      }

      // Phase 3: Handle specific error responses from skipGeneration mode
      if (data?.error) {
        if (data.returnToFeedback) {
          throw new Error('Behavioral interview data not found - returnToFeedback');
        }
        
        if (data.suggestCreatePage) {
          throw new Error('No original questions available - suggestCreatePage');
        }
      }

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

      // Use type=2 to allow user to choose between manual/guided mode
      navigate(`/questions?id=${storylineId}&type=2`);

    } catch (error) {
      console.error('Error creating storyline job:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was an error creating your job practice. Please try again."
      });
    } finally {
      setIsLoading(false);
      setProcessingModal(false);
    }
  };

  return { isLoading, processingModal, submitJobPractice };
};
