
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import FormField from '@/components/FormField';
import FileUpload from '@/components/FileUpload';
import ProcessingModal from '@/components/ProcessingModal';
import { useCreateForm } from '@/hooks/useCreateForm';
import { useAuthContext } from '@/context/AuthContext';
import JobScraper from '@/components/JobScraper';

const Create = () => {
  const { isAuthenticated, isLoading } = useAuthContext();
  const navigate = useNavigate();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const {
    formData,
    resumeFile,
    coverLetterFile,
    additionalDocumentsFile,
    isLoading: formLoading,
    processingModal,
    handleInputChange,
    handleResumeChange,
    handleCoverLetterChange,
    handleAdditionalDocumentsChange,
    handleScrapedJobDescription,
    handleSubmit,
  } = useCreateForm();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-interview-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-6">
      <div className="w-full max-w-3xl mx-auto">
        <div className="mb-8">
          <Link to="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-interview-primary text-center">
          Create Interview Prep Material
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
          <FormField
            id="jobTitle"
            name="jobTitle"
            label="Job Title"
            value={formData.jobTitle}
            onChange={handleInputChange}
            placeholder="Enter job title"
            required
          />

          {/* Add Job Scraper */}
          <JobScraper onScrapedContent={handleScrapedJobDescription} />

          <FormField
            id="jobDescription"
            name="jobDescription"
            label="Job Description"
            value={formData.jobDescription}
            onChange={handleInputChange}
            placeholder="Paste the job description here or use the scraper above"
            required
            isTextarea
          />

          <FormField
            id="companyName"
            name="companyName"
            label="Company Name (Optional)"
            value={formData.companyName}
            onChange={handleInputChange}
            placeholder="Enter company name"
          />

          <FormField
            id="companyDescription"
            name="companyDescription"
            label="Company Description (Optional)"
            value={formData.companyDescription}
            onChange={handleInputChange}
            placeholder="Enter company description"
            isTextarea
            className="min-h-[100px] border-gray-300"
          />

          <div className="pt-4">
            <p className="text-sm text-gray-500 mb-4">Note: All documents must be in PDF format.</p>
            
            <div className="space-y-4">
              <FileUpload
                id="resume"
                label="Resume"
                required
                onFileChange={handleResumeChange}
                currentFile={resumeFile}
              />

              <FileUpload
                id="coverLetter"
                label="Cover Letter (Optional)"
                onFileChange={handleCoverLetterChange}
                currentFile={coverLetterFile}
              />

              <FileUpload
                id="additionalDocuments"
                label="Additional Documents (Optional)"
                onFileChange={handleAdditionalDocumentsChange}
                currentFile={additionalDocumentsFile}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-interview-primary hover:bg-interview-dark text-white py-6"
            disabled={formLoading}
          >
            {formLoading ? 'Processing...' : 'Submit'}
          </Button>
        </form>
      </div>

      <ProcessingModal isOpen={processingModal} />
    </div>
  );
};

export default Create;
