
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

  const extractTextFromPDF = async (file: File): Promise<string> => {
    // We'll extract text on the server side through the edge function
    return `Text from ${file.name}`;
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
      
      // Ensure bucket exists (this will be checked server-side via policies)
      console.log("Creating job with user ID:", user.id);
      
      // Check if user has enough tokens for creating a job practice (5 tokens)
      const { data: tokenData, error: tokenError } = await supabase.rpc(
        'deduct_user_tokens',
        { 
          user_id: user.id, 
          amount: 5 
        }
      );
      
      if (tokenError) {
        console.error("Token error:", tokenError);
        throw new Error(tokenError.message);
      }
      
      console.log("Tokens deducted successfully:", tokenData);
      
      const storylineId = uuidv4();
      
      // Upload resume
      let resumePath = '';
      if (resumeFile) {
        const folderPath = `${user.id}/resumes`;
        const filePath = `${folderPath}/${resumeFile.name}`;
        
        console.log("Uploading resume to:", filePath);
        
        const { data: resumeData, error: resumeError } = await supabase.storage
          .from('interview-app')
          .upload(filePath, resumeFile, {
            cacheControl: '3600',
            upsert: true
          });
        
        if (resumeError) {
          console.error("Resume upload error:", resumeError);
          throw resumeError;
        }
        
        resumePath = resumeData.path;
        console.log("Resume uploaded successfully:", resumePath);
      }
      
      // Upload cover letter if provided
      let coverLetterPath = null;
      if (coverLetterFile) {
        const folderPath = `${user.id}/cover-letters`;
        const filePath = `${folderPath}/${coverLetterFile.name}`;
        
        console.log("Uploading cover letter to:", filePath);
        
        const { data: coverLetterData, error: coverLetterError } = await supabase.storage
          .from('interview-app')
          .upload(filePath, coverLetterFile, {
            cacheControl: '3600',
            upsert: true
          });
        
        if (coverLetterError) {
          console.error("Cover letter upload error:", coverLetterError);
          throw coverLetterError;
        }
        
        coverLetterPath = coverLetterData.path;
        console.log("Cover letter uploaded successfully:", coverLetterPath);
      }
      
      // Upload additional documents if provided
      let additionalDocumentsPath = null;
      if (additionalDocumentsFile) {
        const folderPath = `${user.id}/additional-documents`;
        const filePath = `${folderPath}/${additionalDocumentsFile.name}`;
        
        console.log("Uploading additional documents to:", filePath);
        
        const { data: additionalDocsData, error: additionalDocsError } = await supabase.storage
          .from('interview-app')
          .upload(filePath, additionalDocumentsFile, {
            cacheControl: '3600',
            upsert: true
          });
        
        if (additionalDocsError) {
          console.error("Additional documents upload error:", additionalDocsError);
          throw additionalDocsError;
        }
        
        additionalDocumentsPath = additionalDocsData.path;
        console.log("Additional documents uploaded successfully:", additionalDocumentsPath);
      }
      
      // Extract text from files for processing
      let resumeText = 'Text from resume';
      let coverLetterText = coverLetterFile ? 'Text from cover letter' : '';
      let additionalDocumentsText = additionalDocumentsFile ? 'Text from additional documents' : '';
      
      // Store job data in the database
      console.log("Storing job data with storyline ID:", storylineId);
      
      const { error: insertError } = await supabase
        .from('storyline_jobs')
        .insert({
          id: storylineId,
          job_title: formData.jobTitle,
          job_description: formData.jobDescription,
          company_name: formData.companyName || null,
          company_description: formData.companyDescription || null,
          resume_path: resumePath,
          cover_letter_path: coverLetterPath,
          additional_documents_path: additionalDocumentsPath,
          user_id: user.id,
          status: 'processing'
        });
        
      if (insertError) {
        console.error("Job data insert error:", insertError);
        throw insertError;
      }
      
      console.log("Job data stored successfully");
      
      // Show processing modal
      setProcessingModal(true);
      
      // Call OpenAI function to generate interview questions
      console.log("Calling generate-interview-questions function");
      
      const { error: functionError } = await supabase.functions.invoke('generate-interview-questions', {
        body: {
          jobTitle: formData.jobTitle,
          jobDescription: formData.jobDescription,
          companyName: formData.companyName || '',
          companyDescription: formData.companyDescription || '',
          resumeText,
          coverLetterText,
          additionalDocumentsText,
          resumePath,
          coverLetterPath,
          additionalDocumentsPath,
          userId: user.id,
          storylineId
        }
      });
      
      if (functionError) {
        console.error("Function error:", functionError);
        throw functionError;
      }
      
      console.log("Questions generated successfully");
      
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
