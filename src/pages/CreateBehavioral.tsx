import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import FormField from '@/components/FormField';
import { ArrowLeft, Crown } from 'lucide-react';
import JobScraper from '@/components/JobScraper';
import { ExtractedJobData } from '@/types/jobScraper';
import { useToast } from '@/hooks/use-toast';
import FileUpload from '@/components/FileUpload';
import ProcessingModal from '@/components/ProcessingModal';
import { uploadFile } from '@/hooks/useFileUpload';
import { supabase } from '@/integrations/supabase/client';
import { useBehavioralInterview } from '@/hooks/useBehavioralInterview';
import { usePlanStatus } from '@/hooks/usePlanStatus';
import SoftUsageGate from '@/components/SoftUsageGate';
import { logger } from '@/lib/logger';

const CreateBehavioral = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { generateQuestion } = useBehavioralInterview();
  const { checkUsageLimit, usageSummary } = usePlanStatus();
  
  const [formData, setFormData] = React.useState({
    jobTitle: '',
    jobDescription: '',
    companyName: '',
    companyDescription: '',
  });
  const [resumeFile, setResumeFile] = React.useState<File | null>(null);
  // const [coverLetterFile, setCoverLetterFile] = React.useState<File | null>(null);
  // const [additionalDocumentsFile, setAdditionalDocumentsFile] = React.useState<File | null>(null);
  const [resumeText, setResumeText] = React.useState('');
  // const [coverLetterText, setCoverLetterText] = React.useState('');
  // const [additionalDocumentsText, setAdditionalDocumentsText] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleScrapedContent = (content: string) => {
    setFormData(prev => ({
      ...prev,
      jobDescription: content
    }));
  };

  const handleScrapedCompanyInfo = (companyName: string, companyDescription: string) => {
    setFormData(prev => ({
      ...prev,
      companyName: companyName || prev.companyName,
      companyDescription: companyDescription || prev.companyDescription
    }));
  };

  // NEW: Phase 3 - Handle structured data extraction to auto-fill all fields
  const handleStructuredScrapedData = (data: ExtractedJobData) => {
    logger.debug('Auto-filling behavioral form with structured data', data);
    setFormData(prev => ({
      ...prev,
      jobTitle: data.jobTitle || prev.jobTitle, // Keep existing if extraction failed
      companyName: data.companyName || prev.companyName,
      jobDescription: data.jobDescription || prev.jobDescription,
      companyDescription: data.companyDescription || prev.companyDescription,
    }));
  };

  const handleResumeChange = (file: File | null, text: string) => {
    setResumeFile(file);
    setResumeText(text);
  };

  // const handleCoverLetterChange = (file: File | null, text: string) => {
  //   setCoverLetterFile(file);
  //   setCoverLetterText(text);
  // };

  // const handleAdditionalDocumentsChange = (file: File | null, text: string) => {
  //   setAdditionalDocumentsFile(file);
  //   setAdditionalDocumentsText(text);
  // };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.jobTitle || !formData.jobDescription || !formData.companyName) {
      toast({
        variant: "destructive",
        title: "Required Fields Missing",
        description: "Please fill in job title, job description, and company name.",
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

    if (!resumeText) {
      toast({
        variant: "destructive",
        title: "Resume Text Extraction Failed",
        description: "We couldn't extract text from your resume. Please try a different file.",
      });
      return;
    }

    // Pre-submission usage validation - but allow to proceed for soft gate
    logger.debug('Checking usage limits before behavioral interview creation');
    const usageCheck = await checkUsageLimit('behavioral');
    
    // Don't block here - let the backend handle the soft gate
    logger.debug('Usage check result', { usageCheck });

    setIsProcessing(true);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Authentication required');
      }

      // Upload files to Supabase storage
      let resumePath = '';
      // let coverLetterPath = '';
      // let additionalDocumentsPath = '';
      
      logger.debug('Uploading resume file to Supabase storage');
      
      if (resumeFile) {
        resumePath = await uploadFile(resumeFile, 'job_documents');
        logger.info('Resume uploaded successfully', { resumePath });
      }
      
      // if (coverLetterFile) {
      //   coverLetterPath = await uploadFile(coverLetterFile, 'job_documents');
      //   console.log("Cover letter uploaded successfully, path:", coverLetterPath);
      // }
      
      // if (additionalDocumentsFile) {
      //   additionalDocumentsPath = await uploadFile(additionalDocumentsFile, 'job_documents');
      //   console.log("Additional document uploaded successfully, path:", additionalDocumentsPath);
      // }

      // Create behavioral interview record
      const { data: behavioralData, error: behavioralError } = await supabase
        .from('storyline_behaviorals')
        .insert({
          user_id: user.id,
          job_title: formData.jobTitle,
          job_description: formData.jobDescription,
          company_name: formData.companyName,
          company_description: formData.companyDescription,
          resume_path: resumePath || '',
          cover_letter_path: null, // coverLetterPath || null,
          additional_documents_path: null, // additionalDocumentsPath || null,
          questions: [],
          responses: []
        })
        .select('id')
        .single();
        
      if (behavioralError) {
        throw new Error(`Error creating behavioral interview: ${behavioralError.message}`);
      }

      logger.info('Created behavioral interview', { id: behavioralData.id });

      // Use generateQuestion instead of direct function call with usage validation
      const questionData = await generateQuestion(
        formData,
        resumeText,
        '', // coverLetterText,
        '', // additionalDocumentsText,
        resumePath,
        '', // coverLetterPath,
        '', // additionalDocumentsPath,
        behavioralData.id,
      );

      if (!questionData) {
        throw new Error('Failed to generate first question');
      }

      logger.info('First question generated successfully');

      // Navigate to the interview page with all the data including the first question
      navigate('/behavioral/interview', {
        state: {
          formData,
          resumeText,
          resumePath,
          // coverLetterText,
          // coverLetterPath,
          // additionalDocumentsText,
          // additionalDocumentsPath,
          behavioralId: behavioralData.id,
          firstQuestion: questionData
        }
      });
    } catch (error) {
      logger.error('Error during interview creation', { error });
      
      // Handle usage limit errors with soft gate
      if (error instanceof Error && error.message.includes('Usage limit exceeded')) {
        // Set state to show soft gate instead of hard error
        setIsProcessing(false);
        return; // Don't show error toast, let the soft gate handle it
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "An error occurred while creating your interview.",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Check if user has reached their behavioral limit
  const hasReachedLimit = usageSummary && !usageSummary.isPremium && usageSummary.behavioral.remaining === 0;
  const [showSoftGate, setShowSoftGate] = React.useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-6">
      <ProcessingModal isOpen={isProcessing} processingMessage="Setting up your interview experience…" />
      <div className="w-full max-w-3xl mx-auto">
        <div className="mb-8">
          <Link to="/behavioral">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-interview-primary text-center">
          Create Behavioral Interview Prep
        </h1>

        {/* Usage Status Display */}
        {usageSummary && !usageSummary.isPremium && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Behavioral Interview Practices
                </p>
                <p className="text-sm text-blue-600">
                  {usageSummary.behavioral.remaining} of {usageSummary.behavioral.limit} remaining this month
                </p>
              </div>
              {usageSummary.behavioral.remaining <= 2 && (
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
          {/* Job URL Scraper - Auto-fills multiple fields */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold mb-2 text-blue-900">🚀 Quick Fill from Job URL</h3>
            <p className="text-sm text-blue-700 mb-3">
              Paste a job posting URL to automatically fill Job Title, Company Name, and Job Description
            </p>
            <JobScraper 
              onScrapedContent={handleScrapedContent} 
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
            
            <div className="space-y-4">
              <FileUpload
                id="resume"
                label="Resume"
                required
                onFileChange={handleResumeChange}
                currentFile={resumeFile}
              />

              {/* <FileUpload
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
              /> */}
            </div>
          </div>

          {showSoftGate && hasReachedLimit ? (
            <SoftUsageGate
              usageType="behavioral"
              currentCount={usageSummary?.behavioral.current || 0}
              limit={usageSummary?.behavioral.limit || 5}
              onContinue={() => navigate('/settings')}
              onWaitUntilNextMonth={() => navigate('/behavioral')}
            />
          ) : (
            <Button 
              type="submit" 
              onClick={(e) => {
                if (hasReachedLimit) {
                  e.preventDefault();
                  setShowSoftGate(true);
                  return;
                }
                // Continue with normal form submission
              }}
              className="w-full bg-interview-primary hover:bg-interview-dark text-white py-6"
            >
              Submit
            </Button>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateBehavioral;
