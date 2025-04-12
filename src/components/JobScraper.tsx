
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Globe } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface JobScraperProps {
  onScrapedContent: (content: string) => void;
  className?: string;
}

const JobScraper: React.FC<JobScraperProps> = ({ onScrapedContent, className }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleScrape = async () => {
    if (!url || !url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a valid job posting URL",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Use a CORS proxy to bypass CORS restrictions
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
      }

      const data = await response.text();
      
      // Extract the main content by removing HTML tags and normalizing whitespace
      const parser = new DOMParser();
      const doc = parser.parseFromString(data, 'text/html');
      
      // Try to find the job description content (this is simplified and may need refinement)
      // Looking for common job description containers
      const possibleContainers = [
        doc.querySelector('.job-description'),
        doc.querySelector('[data-automation="jobDescription"]'),
        doc.querySelector('[data-testid="jobDescriptionText"]'),
        doc.querySelector('.description'),
        doc.querySelector('article'),
        doc.querySelector('main'),
        doc.querySelector('body')
      ];
      
      // Use the first non-null container
      const contentContainer = possibleContainers.find(container => container !== null);
      
      if (contentContainer) {
        // Clean up the text content
        let jobDescription = contentContainer.textContent || '';
        jobDescription = jobDescription
          .replace(/\s+/g, ' ')
          .trim();
        
        // Pass the scraped content to the parent component
        onScrapedContent(jobDescription);
        
        toast({
          title: "Job Description Scraped",
          description: "Successfully extracted job description from URL",
        });
      } else {
        throw new Error('Could not extract job description from the page');
      }
    } catch (err) {
      console.error('Error scraping website:', err);
      toast({
        title: "Scraping Failed",
        description: err instanceof Error ? err.message : 'Error scraping website',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
      <div className="relative flex-grow">
        <Input
          type="url"
          value={url}
          onChange={handleUrlChange}
          placeholder="https://example.com/jobs/software-engineer"
          className="pr-10"
        />
        <Globe className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      </div>
      <Button 
        onClick={handleScrape} 
        disabled={isLoading}
        className="bg-interview-primary hover:bg-interview-dark gap-2 whitespace-nowrap"
      >
        <Search className="h-4 w-4" /> 
        {isLoading ? 'Scraping...' : 'Scrape Job'}
      </Button>
    </div>
  );
};

export default JobScraper;
