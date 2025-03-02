
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

const Create = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    jobTitle: '',
    jobDescription: '',
    companyName: '',
    companyDescription: '',
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
  const [additionalDocumentsFile, setAdditionalDocumentsFile] = useState<File | null>(null);
  const [processingModal, setProcessingModal] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'resume' | 'coverLetter' | 'additionalDocuments') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check if file is a PDF
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file.",
          variant: "destructive",
        });
        return;
      }

      switch (fileType) {
        case 'resume':
          setResumeFile(file);
          break;
        case 'coverLetter':
          setCoverLetterFile(file);
          break;
        case 'additionalDocuments':
          setAdditionalDocumentsFile(file);
          break;
      }
    }
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
    
    // Validate required fields
    if (!formData.jobTitle || !formData.jobDescription || !resumeFile) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields and upload your resume.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Show processing modal
      setProcessingModal(true);

      // Upload resume (required)
      const resumePath = await uploadFile(resumeFile, 'resumes');
      
      // Upload optional files if they exist
      let coverLetterPath = null;
      let additionalDocumentsPath = null;
      
      if (coverLetterFile) {
        coverLetterPath = await uploadFile(coverLetterFile, 'cover-letters');
      }
      
      if (additionalDocumentsFile) {
        additionalDocumentsPath = await uploadFile(additionalDocumentsFile, 'additional-documents');
      }

      // Call Supabase Edge Function to process with OpenAI
      const { data, error } = await supabase.functions.invoke('generate-interview-questions', {
        body: {
          jobTitle: formData.jobTitle,
          jobDescription: formData.jobDescription,
          companyName: formData.companyName,
          companyDescription: formData.companyDescription,
          resumePath: resumePath,
          coverLetterPath: coverLetterPath,
          additionalDocumentsPath: additionalDocumentsPath,
        },
      });

      if (error) {
        throw new Error(`Error processing your application: ${error.message}`);
      }

      // Save to storyline table
      const { error: insertError } = await supabase
        .from('storyline')
        .insert({
          job_title: formData.jobTitle,
          job_description: formData.jobDescription,
          company_name: formData.companyName,
          company_description: formData.companyDescription,
          resume_path: resumePath,
          cover_letter_path: coverLetterPath,
          additional_documents_path: additionalDocumentsPath,
          openai_response: data,
        });

      if (insertError) {
        throw new Error(`Error saving your application: ${insertError.message}`);
      }

      toast({
        title: "Success!",
        description: "Your interview questions are being generated. You'll be redirected shortly.",
      });

      // Redirect would happen here in a real app after a delay
      setTimeout(() => {
        setProcessingModal(false);
        // Here you would redirect to questions page
      }, 3000);

    } catch (error) {
      setProcessingModal(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
          <div className="space-y-2">
            <Label htmlFor="jobTitle" className="text-interview-primary font-medium">
              Job Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="jobTitle"
              name="jobTitle"
              placeholder="Enter job title"
              value={formData.jobTitle}
              onChange={handleInputChange}
              required
              className="border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobDescription" className="text-interview-primary font-medium">
              Job Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="jobDescription"
              name="jobDescription"
              placeholder="Paste the job description here"
              value={formData.jobDescription}
              onChange={handleInputChange}
              required
              className="min-h-[150px] border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-interview-primary font-medium">
              Company Name (Optional)
            </Label>
            <Input
              id="companyName"
              name="companyName"
              placeholder="Enter company name"
              value={formData.companyName}
              onChange={handleInputChange}
              className="border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyDescription" className="text-interview-primary font-medium">
              Company Description (Optional)
            </Label>
            <Textarea
              id="companyDescription"
              name="companyDescription"
              placeholder="Enter company description"
              value={formData.companyDescription}
              onChange={handleInputChange}
              className="min-h-[100px] border-gray-300"
            />
          </div>

          <div className="pt-4">
            <p className="text-sm text-gray-500 mb-4">Note: All documents must be in PDF format.</p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resume" className="text-interview-primary font-medium">
                  Resume <span className="text-red-500">*</span>
                </Label>
                <div className="border border-dashed border-gray-300 rounded-md p-4">
                  <div className="flex items-center justify-center flex-col">
                    <input
                      id="resume"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, 'resume')}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('resume')?.click()}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {resumeFile ? resumeFile.name : 'Upload Document'}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">Only PDF files are supported</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverLetter" className="text-interview-primary font-medium">
                  Cover Letter (Optional)
                </Label>
                <div className="border border-dashed border-gray-300 rounded-md p-4">
                  <div className="flex items-center justify-center flex-col">
                    <input
                      id="coverLetter"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, 'coverLetter')}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('coverLetter')?.click()}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {coverLetterFile ? coverLetterFile.name : 'Upload Document'}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">Only PDF files are supported</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalDocuments" className="text-interview-primary font-medium">
                  Additional Documents (Optional)
                </Label>
                <div className="border border-dashed border-gray-300 rounded-md p-4">
                  <div className="flex items-center justify-center flex-col">
                    <input
                      id="additionalDocuments"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, 'additionalDocuments')}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('additionalDocuments')?.click()}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {additionalDocumentsFile ? additionalDocumentsFile.name : 'Upload Document'}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">Only PDF files are supported</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-interview-primary hover:bg-interview-dark text-white py-6"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Submit'}
          </Button>
        </form>
      </div>

      {/* Processing Modal */}
      {processingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-interview-primary">Creating Your Interview Questions</h2>
            <p className="mb-6 text-gray-600">
              We're analyzing your job details and generating tailored interview questions. This may take a few minutes.
            </p>
            <p className="text-gray-600">We'll redirect you to your questions once they're ready.</p>
            <div className="flex justify-center mt-6">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-interview-primary"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Create;
