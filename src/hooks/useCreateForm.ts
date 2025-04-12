
import { useState, useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useJobPracticeSubmission } from './useJobPracticeSubmission';

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
  const { user } = useAuthContext();
  const [formData, setFormData] = useState<FormData>({
    jobTitle: '',
    jobDescription: '',
    companyName: '',
    companyDescription: '',
  });
  const [resumeFile, setResumeFile] = useState<FileData>({ file: null, text: '' });
  const [coverLetterFile, setCoverLetterFile] = useState<FileData>({ file: null, text: '' });
  const [additionalDocumentsFile, setAdditionalDocumentsFile] = useState<FileData>({ file: null, text: '' });

  const { 
    isLoading, 
    processingModal, 
    submitJobPractice 
  } = useJobPracticeSubmission(
    user?.id, 
    formData, 
    resumeFile, 
    coverLetterFile, 
    additionalDocumentsFile
  );

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

  const handleScrapedJobDescription = (scrapedContent: string) => {
    setFormData((prev) => ({
      ...prev,
      jobDescription: scrapedContent,
    }));
  };

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await submitJobPractice();
  }, [submitJobPractice]);

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
    handleScrapedJobDescription,
    handleSubmit,
  };
};
