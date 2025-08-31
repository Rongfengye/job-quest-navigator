
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Globe } from 'lucide-react';
import FormField from '@/components/FormField';
import FileUpload from '@/components/FileUpload';
import ProcessingModal from '@/components/ProcessingModal';
import { useCreateForm } from '@/hooks/useCreateForm';
import { useAuthContext } from '@/context/AuthContext';
import JobScraper from '@/components/JobScraper';
import { ExtractedJobData } from '@/types/jobScraper';

const Create = () => {
  const { isAuthenticated, isLoading } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

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
    handleStructuredScrapedData, // NEW: Phase 3
    handleSubmit,
  } = useCreateForm();

  // Handle resume data passed from dashboard
  useEffect(() => {
    const state = location.state as { resumeFile?: File; resumeText?: string; fromDashboard?: boolean };
    if (state?.fromDashboard && state.resumeFile && state.resumeText) {
      handleResumeChange(state.resumeFile, state.resumeText);
    }
  }, [location.state, handleResumeChange]);

  const handleScrapedCompanyInfo = (companyName: string, companyDescription: string) => {
    console.log("Received company info in Create.tsx:", { companyName, companyDescription });
    if (companyName) {
      handleInputChange({
        target: { name: 'companyName', value: companyName }
      } as React.ChangeEvent<HTMLInputElement>);
    }
    if (companyDescription) {
      handleInputChange({
        target: { name: 'companyDescription', value: companyDescription }
      } as React.ChangeEvent<HTMLTextAreaElement>);
    }
  };

  // For debugging
  React.useEffect(() => {
    console.log("Create page Form Data:", formData);
  }, [formData]);

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
          {/* Job URL Scraper - Auto-fills multiple fields */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold mb-2 text-blue-900">🚀 Quick Fill from Job URL</h3>
            <p className="text-sm text-blue-700 mb-3">
              Paste a job posting URL to automatically fill Job Title, Company Name, and Job Description
            </p>
            <JobScraper 
              onScrapedContent={handleScrapedJobDescription} 
              onCompanyInfoFound={handleScrapedCompanyInfo}
              onStructuredDataExtracted={handleStructuredScrapedData} // NEW: Phase 3
              className="" 
            />
          </div>

          <FormField
            id="companyName"
            name="companyName"
            label="Company Name"
            value={formData.companyName}
            onChange={handleInputChange}
            placeholder="Enter company name"
            required
          />

          <FormField
            id="jobTitle"
            name="jobTitle"
            label="Job Title"
            value={formData.jobTitle}
            onChange={handleInputChange}
            placeholder="Enter job title"
            required
          />

          <FormField
            id="jobDescription"
            name="jobDescription"
            label="Job Description"
            value={formData.jobDescription}
            onChange={handleInputChange}
            placeholder="Paste the job description here"
            required
            isTextarea
          />

          <div className="pt-4">
            <p className="text-sm text-gray-500 mb-4">Note: All Resumes must be in PDF format.</p>
            
            <div className="space-y-4">
              <FileUpload
                id="resume"
                label="Resume"
                required
                onFileChange={handleResumeChange}
                currentFile={resumeFile}
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
