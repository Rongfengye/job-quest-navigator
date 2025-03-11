
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';

interface FormData {
  jobTitle: string;
  jobDescription: string;
  companyName: string;
  companyDescription: string;
}

export const useCreateForm = () => {
  const [formData, setFormData] = useState<FormData>({
    jobTitle: '',
    jobDescription: '',
    companyName: '',
    companyDescription: '',
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
  const [additionalDocumentsFile, setAdditionalDocumentsFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [processingModal, setProcessingModal] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleResumeChange = (file: File | null) => {
    setResumeFile(file);
  };

  const handleCoverLetterChange = (file: File | null) => {
    setCoverLetterFile(file);
  };

  const handleAdditionalDocumentsChange = (file: File | null) => {
    setAdditionalDocumentsFile(file);
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from('interview-app')
      .upload(`${path}/${file.name}`, file);

    if (error) {
      throw new Error(error.message);
    }

    return data.path;
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    let text = '';
    try {
      // Use PDF.js (or other library) to extract text
      // For now, we'll just return a placeholder
      text = `Text extracted from ${file.name}`;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
    }
    return text;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to create interview materials.",
      });
      return;
    }

    if (!resumeFile) {
      toast({
        variant: "destructive",
        title: "Resume Required",
        description: "Please upload your resume to continue.",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Check if user has enough tokens for creating a job practice (5 tokens)
      const { data: tokenData, error: tokenError } = await supabase.rpc(
        'deduct_user_tokens',
        { user_id: user.id, amount: 5 }
      );
      
      if (tokenError) {
        throw new Error(tokenError.message);
      }
      
      const storylineId = uuidv4();
      
      // Process files in parallel
      const uploadPromises = [];
      
      // Upload resume
      if (resumeFile) {
        const resumePath = `${user.id}/resumes/${resumeFile.name}`;
        uploadPromises.push(supabase.storage
          .from('interview-app')
          .upload(resumePath, resumeFile)
          .then(() => resumePath));
      }
      
      // Upload cover letter if provided
      let coverLetterPath = null;
      if (coverLetterFile) {
        coverLetterPath = `${user.id}/cover-letters/${coverLetterFile.name}`;
        uploadPromises.push(supabase.storage
          .from('interview-app')
          .upload(coverLetterPath, coverLetterFile)
          .then(() => coverLetterPath));
      }
      
      // Upload additional documents if provided
      let additionalDocumentsPath = null;
      if (additionalDocumentsFile) {
        additionalDocumentsPath = `${user.id}/additional-documents/${additionalDocumentsFile.name}`;
        uploadPromises.push(supabase.storage
          .from('interview-app')
          .upload(additionalDocumentsPath, additionalDocumentsFile)
          .then(() => additionalDocumentsPath));
      }
      
      // Wait for all uploads to complete
      const uploadResults = await Promise.all(uploadPromises);
      const resumeFilePath = uploadResults[0];
      
      // Extract text from files for processing
      let resumeText = '';
      let coverLetterText = '';
      let additionalDocumentsText = '';
      
      // For a real implementation, you'd extract text from PDFs here
      if (resumeFile) resumeText = "Text from resume";
      if (coverLetterFile) coverLetterText = "Text from cover letter";
      if (additionalDocumentsFile) additionalDocumentsText = "Text from additional documents";
      
      // Store job data in the database
      const { error: insertError } = await supabase
        .from('storyline_jobs')
        .insert({
          id: storylineId,
          job_title: formData.jobTitle,
          job_description: formData.jobDescription,
          company_name: formData.companyName || null,
          company_description: formData.companyDescription || null,
          resume_path: resumeFilePath,
          cover_letter_path: coverLetterPath,
          additional_documents_path: additionalDocumentsPath,
          user_id: user.id,
          status: 'processing'
        });
        
      if (insertError) throw insertError;
      
      // Show processing modal
      setProcessingModal(true);
      
      // Call OpenAI function to generate interview questions
      const { error: functionError } = await supabase.functions.invoke('generate-interview-questions', {
        body: {
          jobTitle: formData.jobTitle,
          jobDescription: formData.jobDescription,
          companyName: formData.companyName || '',
          companyDescription: formData.companyDescription || '',
          resumeText,
          coverLetterText,
          additionalDocumentsText,
          resumePath: resumeFilePath,
          coverLetterPath,
          additionalDocumentsPath,
          userId: user.id,
          storylineId
        }
      });
      
      if (functionError) throw functionError;
      
      // Redirect to the questions page
      setTimeout(() => {
        navigate(`/questions?id=${storylineId}`);
      }, 1000);
      
    } catch (error) {
      console.error('Error creating interview materials:', error);
      setProcessingModal(false);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred while creating interview materials.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    resumeFile,
    coverLetterFile,
    additionalDocumentsFile,
    isLoading,
    processingModal,
    handleInputChange,
    handleResumeChange,
    handleCoverLetterChange,
    handleAdditionalDocumentsChange,
    handleSubmit,
  };
};
