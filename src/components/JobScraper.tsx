
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JobScraperProps {
  onScrapedContent: (content: string) => void;
  onCompanyInfoFound?: (companyName: string, companyDescription: string) => void;
  className?: string;
}

const JobScraper: React.FC<JobScraperProps> = ({ onScrapedContent, onCompanyInfoFound, className }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const findCompanyInfo = (doc: Document) => {
    // Common selectors for company information
    const companyNameSelectors = [
      '[data-testid="company-name"]',
      '.company-name',
      '[itemprop="hiringOrganization"]',
      '.organization',
      'meta[property="og:site_name"]',
    ];

    const companyDescriptionSelectors = [
      '[data-testid="company-description"]',
      '.company-description',
      '[itemprop="description"]',
      '.organization-description',
      'meta[name="description"]',
    ];

    let companyName = '';
    let companyDescription = '';

    // Try to find company name
    for (const selector of companyNameSelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        companyName = element instanceof HTMLMetaElement ? element.content : element.textContent || '';
        if (companyName.trim()) break;
      }
    }

    // Try to find company description
    for (const selector of companyDescriptionSelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        companyDescription = element instanceof HTMLMetaElement ? element.content : element.textContent || '';
        if (companyDescription.trim()) break;
      }
    }

    // Clean up the text
    companyName = companyName.trim();
    companyDescription = companyDescription.trim();

    console.log("Found company info:", { companyName, companyDescription });
    return { companyName, companyDescription };
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
      console.log("Fetching URL:", proxyUrl);
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
      }

      const data = await response.text();
      console.log("Fetched data length:", data.length);
      
      // Extract the main content by removing HTML tags and normalizing whitespace
      const parser = new DOMParser();
      const doc = parser.parseFromString(data, 'text/html');
      
      // Try to find the job description content
      const possibleContainers = [
        doc.querySelector('.job-description'),
        doc.querySelector('[data-automation="jobDescription"]'),
        doc.querySelector('[data-testid="jobDescriptionText"]'),
        doc.querySelector('.description'),
        doc.querySelector('article'),
        doc.querySelector('main'),
        doc.querySelector('body')
      ];
      
      const contentContainer = possibleContainers.find(container => container !== null);
      
      if (contentContainer) {
        let jobDescription = contentContainer.textContent || '';
        jobDescription = jobDescription
          .replace(/\s+/g, ' ')
          .trim();
        
        console.log("Extracted job description:", jobDescription.substring(0, 100) + "...");
        
        // Pass the scraped content to the parent component
        if (jobDescription) {
          onScrapedContent(jobDescription);
        }

        // Find and pass company information if the callback exists
        if (onCompanyInfoFound) {
          const { companyName, companyDescription } = findCompanyInfo(doc);
          if (companyName || companyDescription) {
            onCompanyInfoFound(companyName, companyDescription);
            toast({
              title: "Company Information Found",
              description: "Successfully extracted company details",
            });
          }
        }
        
        toast({
          title: "Job Description Scraped",
          description: "Successfully extracted job description from URL",
        });
      } else {
        console.error("No content container found");
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
