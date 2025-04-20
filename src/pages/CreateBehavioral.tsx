
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import FormField from '@/components/FormField';
import { ArrowLeft } from 'lucide-react';
import JobScraper from '@/components/JobScraper';
import { useToast } from '@/hooks/use-toast';
import FileUpload from '@/components/FileUpload';

const CreateBehavioral = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log(`Updating form field ${name} with value: ${value.substring(0, 30)}...`);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleScrapedContent = (content: string) => {
    console.log("Received scraped job description:", content.substring(0, 100) + "...");
    setFormData(prev => ({
      ...prev,
      jobDescription: content
    }));
  };

  const handleScrapedCompanyInfo = (companyName: string, companyDescription: string) => {
    console.log("Received company info:", { companyName, companyDescription });
    setFormData(prev => ({
      ...prev,
      companyName: companyName || prev.companyName,
      companyDescription: companyDescription || prev.companyDescription
    }));
  };

  const handleResumeChange = (file: File | null, text: string) => {
    setResumeFile(file);
    setResumeText(text);
    console.log("Resume text extracted:", text ? text.substring(0, 100) + "..." : "No text");
  };

  const handleCoverLetterChange = (file: File | null, text: string) => {
    setCoverLetterFile(file);
    setCoverLetterText(text);
    console.log("Cover letter text extracted:", text ? text.substring(0, 100) + "..." : "No text");
  };

  const handleAdditionalDocumentsChange = (file: File | null, text: string) => {
    setAdditionalDocumentsFile(file);
    setAdditionalDocumentsText(text);
    console.log("Additional documents text extracted:", text ? text.substring(0, 100) + "..." : "No text");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.jobTitle || !formData.jobDescription) {
      toast({
        variant: "destructive",
        title: "Required Fields Missing",
        description: "Please fill in both job title and description.",
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

    // Navigate to the behavioral interview page with the form data
    navigate('/behavioral/interview', { // Updated route
      state: {
        formData,
        resumeText,
        coverLetterText,
        additionalDocumentsText
      }
    });
  };

  // For debugging
  React.useEffect(() => {
    console.log("CreateBehavioral Form Data:", formData);
  }, [formData]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-6">
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
          >
            Submit
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CreateBehavioral;
