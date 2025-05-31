import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import FormField from '@/components/FormField';
import { ArrowLeft } from 'lucide-react';
import JobScraper from '@/components/JobScraper';
import { useToast } from '@/hooks/use-toast';
import FileUpload from '@/components/FileUpload';
import ProcessingModal from '@/components/ProcessingModal';
import { uploadFile } from '@/hooks/useFileUpload';
import { supabase } from '@/integrations/supabase/client';
import { useUserTokens } from '@/hooks/useUserTokens';

const CreateBehavioral = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { deductTokens } = useUserTokens();
  const [formData, setFormData] = React.useState({
    jobTitle: '',
    jobDescription: '',
    companyName: '',
    companyDescription: '',
  });
  const [resumeFile, setResumeFile] = React.useState<File | null>(null);
  const [coverLetterFile, setCoverLetterFile] = React.useState<File | null>(null);
  const [additionalDocumentsFile, setAdditionalDocumentsFile] = React.useState<File | null>(null);
  const [resumeText, setResumeText] = React.useState('');
  const [coverLetterText, setCoverLetterText] = React.useState('');
  const [additionalDocumentsText, setAdditionalDocumentsText] = React.useState('');
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

  const handleResumeChange = (file: File | null, text: string) => {
    setResumeFile(file);
    setResumeText(text);
  };

  const handleCoverLetterChange = (file: File | null, text: string) => {
    setCoverLetterFile(file);
    setCoverLetterText(text);
  };

  const handleAdditionalDocumentsChange = (file: File | null, text: string) => {
    setAdditionalDocumentsFile(file);
    setAdditionalDocumentsText(text);
  };

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

    setIsProcessing(true);

    try {
      // Check tokens first
      const tokenCheck = await deductTokens(1);
      if (!tokenCheck?.success) {
        toast({
          variant: "destructive",
          title: "Insufficient tokens",
          description: "You need at least 1 token to start a behavioral interview.",
        });
        return;
      }

      // Upload files to Supabase storage
      let resumePath = '';
      let coverLetterPath = '';
      let additionalDocumentsPath = '';
      
      console.log("Uploading resume file to Supabase storage...");
      
      if (resumeFile) {
        resumePath = await uploadFile(resumeFile, 'job_documents');
        console.log("Resume uploaded successfully, path:", resumePath);
      }
      
      if (coverLetterFile) {
        coverLetterPath = await uploadFile(coverLetterFile, 'job_documents');
        console.log("Cover letter uploaded successfully, path:", coverLetterPath);
      }
      
      if (additionalDocumentsFile) {
        additionalDocumentsPath = await uploadFile(additionalDocumentsFile, 'job_documents');
        console.log("Additional document uploaded successfully, path:", additionalDocumentsPath);
      }

      // Create behavioral interview record
      const { data: behavioralData, error: behavioralError } = await supabase
        .from('storyline_behaviorals')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          job_title: formData.jobTitle,
          job_description: formData.jobDescription,
          company_name: formData.companyName,
          company_description: formData.companyDescription,
          resume_path: resumePath || '',
          cover_letter_path: coverLetterPath || null,
          additional_documents_path: additionalDocumentsPath || null
        })
        .select('id')
        .single();
        
      if (behavioralError) {
        throw new Error(`Error creating behavioral interview: ${behavioralError.message}`);
      }
      
      console.log("Created behavioral interview with ID:", behavioralData.id);

      // Generate the first question
      const requestBody = {
        jobTitle: formData.jobTitle,
        jobDescription: formData.jobDescription,
        companyName: formData.companyName,
        companyDescription: formData.companyDescription,
        resumeText,
        coverLetterText,
        additionalDocumentsText,
        previousQuestions: [],
        previousAnswers: [],
        questionIndex: 0,
        generateAudio: true,
        voice: 'alloy',
        resumePath: resumePath || ''
      };
      
      console.log('Generating first question on create page...');
      
      const { data: questionData, error: questionError } = await supabase.functions.invoke('storyline-create-behavioral-interview', {
        body: requestBody,
      });
      
      if (questionError) {
        throw new Error(`Error generating question: ${questionError.message}`);
      }
      
      if (!questionData || !questionData.question) {
        throw new Error('No question was generated');
      }
      
      console.log('First question generated successfully:', questionData.question);

      // Update the behavioral record with the first question
      await supabase
        .from('storyline_behaviorals')
        .update({
          questions: [questionData.question]
        })
        .eq('id', behavioralData.id);
      
      // Navigate to the interview page with all the data including the pre-loaded question
      navigate('/behavioral/interview', {
        state: {
          formData,
          resumeText,
          resumePath,
          coverLetterText,
          coverLetterPath,
          additionalDocumentsText,
          additionalDocumentsPath,
          behavioralId: behavioralData.id,
          preloadedQuestion: {
            question: questionData.question,
            explanation: questionData.explanation || '',
            questionIndex: 0,
            storylineId: behavioralData.id,
            audio: questionData.audio || null
          }
        }
      });
    } catch (error) {
      console.error('Error processing behavioral interview:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred while processing your request.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-6">
      <ProcessingModal isOpen={isProcessing} />
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

          <FormField
            id="jobDescription"
            name="jobDescription"
            label="Job Description"
            value={formData.jobDescription}
            onChange={handleInputChange}
            placeholder="Paste the job description here or use the scraper"
            required
            isTextarea
            additionalComponent={
              <JobScraper 
                onScrapedContent={handleScrapedContent} 
                onCompanyInfoFound={handleScrapedCompanyInfo}
                className="mb-2" 
              />
            }
          />

          <FormField
            id="companyName"
            name="companyName"
            label="Company Name"
            value={formData.companyName}
            onChange={handleInputChange}
            placeholder="Enter company name"
            required
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
          >
            Submit
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CreateBehavioral;
