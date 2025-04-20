
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import FormField from '@/components/FormField';
import { ArrowLeft } from 'lucide-react';
import JobScraper from '@/components/JobScraper';
import { useToast } from '@/hooks/use-toast';

const CreateBehavioral = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = React.useState({
    jobTitle: '',
    jobDescription: '',
    companyName: '',
    companyDescription: '',
  });

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
      companyName,
      companyDescription
    }));
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

    // For now, just navigate to the behavioral test
    navigate('/behavioral/test');
  };

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
