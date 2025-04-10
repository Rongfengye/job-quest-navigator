import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { useUserTokens } from '@/hooks/useUserTokens';
import { filterValue, safeDatabaseData } from '@/utils/supabaseTypes';

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

export const useCreateForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { deductTokens, fetchTokens } = useUserTokens();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    jobTitle: '',
    jobDescription: '',
    companyName: '',
    companyDescription: '',
  });
  const [resumeFile, setResumeFile] = useState<FileData>({ file: null, text: '' });
  const [coverLetterFile, setCoverLetterFile] = useState<FileData>({ file: null, text: '' });
  const [additionalDocumentsFile, setAdditionalDocumentsFile] = useState<FileData>({ file: null, text: '' });
  const [processingModal, setProcessingModal] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleResumeChange = (file: File | null, text: string) => {
    console.log("Resume text extracted:", text.substring(0, 100) + "...");
    setResumeFile({ file, text });
  };

  const handleCoverLetterChange = (file: File | null, text: string) => {
    console.log("Cover letter text extracted:", text ? text.substring(0, 100) + "..." : "No text");
    setCoverLetterFile({ file, text });
  };

  const handleAdditionalDocumentsChange = (file: File | null, text: string) => {
    console.log("Additional documents text extracted:", text ? text.substring(0, 100) + "..." : "No text");
    setAdditionalDocumentsFile({ file, text });
  };

  const uploadFile = async (file: File, path: string) => {
    const fileExt = file.name.split('.').pop();
    const filePath = `${path}/${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('job_documents')
      .upload(filePath, file);

    if (error) {
      throw new Error(`Error uploading file: ${error.message}`);
    }

    return filePath;
  };

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to create a job practice."
      });
      return;
    }
    
    // Check if user has enough tokens (5 tokens required)
    const tokenCheck = await deductTokens(5);
    if (!tokenCheck?.success) {
      return; // The token hook will show an error toast for insufficient tokens
    }
    
    // Refresh token display immediately after deduction
    fetchTokens();
    setIsLoading(true);
    setProcessingModal(true);
    
    try {
      const resumePath = await uploadFile(resumeFile.file, 'resumes');
      
      let coverLetterPath = null;
      let additionalDocumentsPath = null;
      
      if (coverLetterFile.file) {
        coverLetterPath = await uploadFile(coverLetterFile.file, 'cover-letters');
      }
      
      if (additionalDocumentsFile.file) {
        additionalDocumentsPath = await uploadFile(additionalDocumentsFile.file, 'additional-documents');
      }

      console.log("Inserting job with user_id:", user.id);
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
          user_id: user.id
        })
        .select('id')
        .single();

      if (insertError) {
        console.error("Insert error details:", insertError);
        throw new Error(`Error saving your application: ${insertError.message}`);
      }

      const safeStorylineData = safeDatabaseData(storylineData);
      const storylineId = safeStorylineData.id;

      const requestBody = {
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

      const { data, error } = await supabase.functions.invoke('generate-interview-questions', {
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
        .eq('id', filterValue(storylineId));

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
      // If there was an error, refund the tokens
      await deductTokens(-5); // Add back the tokens that were deducted
      fetchTokens(); // Update token display after refund
    } finally {
      setIsLoading(false);
    }
  }, [formData, resumeFile, coverLetterFile, additionalDocumentsFile, navigate, toast, user?.id, deductTokens, fetchTokens]);

  return {
    formData,
    resumeFile: resumeFile.file,
    coverLetterFile: coverLetterFile.file,
    additionalDocumentsFile: additionalDocumentsFile.file,
    isLoading,
    processingModal,
    handleInputChange,
    handleResumeChange,
    handleCoverLetterChange,
    handleAdditionalDocumentsChange,
    handleSubmit,
  };
};
