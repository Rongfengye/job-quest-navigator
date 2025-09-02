
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
import { usePlanStatus } from '@/hooks/usePlanStatus';
import SoftUsageGate from '@/components/SoftUsageGate';

const Create = () => {
  const { isAuthenticated, isLoading } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { usageSummary } = usePlanStatus();
  const [showSoftGate, setShowSoftGate] = React.useState(false);

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

        {/* Enhanced Header with Progress */}
        <div className="text-center mb-8">
          <div className="mb-2">
            <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              Step 1 of 2 – Upload Your Resume & Job Details
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-interview-primary">
            Generate Personalized Behavioral Interview Questions
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get tailored questions based on your resume and job posting to sharpen your prep.
          </p>
        </div>

        {/* Usage Status Display */}
        {usageSummary && !usageSummary.isPremium && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Question Vault Generations
                </p>
                <p className="text-sm text-blue-600">
                  {usageSummary.questionVault.remaining} of {usageSummary.questionVault.limit} remaining this month
                </p>
              </div>
              {usageSummary.questionVault.remaining <= 0 && (
                <Link to="/settings">
                  <Button variant="outline" size="sm">
                    Upgrade to Premium
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
          {/* Enhanced Auto-Fill Section */}
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 relative">
            <div className="absolute top-4 right-4">
              <span className="inline-block px-2 py-1 text-xs font-semibold bg-green-500 text-white rounded-full">
                Recommended
              </span>
            </div>
            <h3 className="text-xl font-bold mb-2 text-blue-900 flex items-center gap-2">
              Save time with Auto-Fill
            </h3>
            <p className="text-sm text-blue-700 mb-4">
              Paste a job post URL and we'll grab the title, company, and description for you.
            </p>
            <JobScraper 
              onScrapedContent={handleScrapedJobDescription} 
              onCompanyInfoFound={handleScrapedCompanyInfo}
              onStructuredDataExtracted={handleStructuredScrapedData}
              className="" 
            />
          </div>

          {/* Job Info Section */}
          <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
              Job Info
            </h3>
            <div className="space-y-4">

            <FormField
              id="companyName"
              name="companyName"
              label="Company Name"
              value={formData.companyName}
              onChange={handleInputChange}
              placeholder="Amazon"
              required
            />

            <FormField
              id="jobTitle"
              name="jobTitle"
              label="Job Title"
              value={formData.jobTitle}
              onChange={handleInputChange}
              placeholder="Software Engineer"
              required
            />

            <FormField
              id="jobDescription"
              name="jobDescription"
              label="Job Description"
              value={formData.jobDescription}
              onChange={handleInputChange}
              placeholder="Paste the full job description here..."
              required
              isTextarea
            />
            </div>
          </div>

          {/* Upload Resume Section */}
          <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
              Upload Resume
            </h3>

            <p className="text-sm text-gray-500 mb-4">Note: All Resumes must be in PDF format.</p>
            <FileUpload
              id="resume"
              label="Resume"
              required
              onFileChange={handleResumeChange}
              currentFile={resumeFile}
            />
          </div>

          {showSoftGate && usageSummary && !usageSummary.isPremium && usageSummary.questionVault.remaining === 0 ? (
            <SoftUsageGate
              usageType="question_vault"
              currentCount={usageSummary.questionVault.current}
              limit={usageSummary.questionVault.limit}
              onContinue={() => navigate('/settings')}
              onWaitUntilNextMonth={() => navigate('/')}
            />
          ) : (
            <Button 
              type="submit" 
              onClick={(e) => {
                if (usageSummary && !usageSummary.isPremium && usageSummary.questionVault.remaining === 0) {
                  e.preventDefault();
                  setShowSoftGate(true);
                  return;
                }
                // Continue with normal form submission
              }}
              className="w-full bg-interview-primary hover:bg-interview-dark text-white py-6"
              disabled={formLoading}
            >
              {formLoading ? 'Processing...' : 'Submit'}
            </Button>
          )}
        </form>
      </div>

      <ProcessingModal isOpen={processingModal} />
    </div>
  );
};

export default Create;
