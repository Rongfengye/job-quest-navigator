
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  const { user } = useAuth();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.jobTitle || !formData.jobDescription || !resumeFile.file) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields and upload your resume.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to continue.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    setIsLoading(true);
    
    try {
      setProcessingModal(true);

      const resumePath = await uploadFile(resumeFile.file, 'resumes'); 
      
      let coverLetterPath = null;
      let additionalDocumentsPath = null;
      
      if (coverLetterFile.file) {
        coverLetterPath = await uploadFile(coverLetterFile.file, 'cover-letters');
      }
      
      if (additionalDocumentsFile.file) {
        additionalDocumentsPath = await uploadFile(additionalDocumentsFile.file, 'additional-documents');
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
          user_id: user.id
        })
        .select('id')
        .single();

      if (insertError) {
        throw new Error(`Error saving your application: ${insertError.message}`);
      }

      const storylineId = storylineData.id;

      // Log the data being sent to the OpenAI function
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
      setProcessingModal(false);
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
