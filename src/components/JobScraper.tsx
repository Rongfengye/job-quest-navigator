
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

  // Fallback scraping function for when Firecrawl fails
  const fallbackScrape = async (url: string) => {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    console.log("Using fallback scraping for URL:", proxyUrl);
    
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const data = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, 'text/html');
    
    // Extract job description
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
    if (!contentContainer) {
      throw new Error('Could not extract job description from the page');
    }
    
    let jobDescription = contentContainer.textContent || '';
    jobDescription = jobDescription.replace(/\s+/g, ' ').trim();
    
    // Extract company info
    const companySelectors = [
      '[data-testid="company-name"]',
      '.company-name',
      '[itemprop="hiringOrganization"]',
      '.organization',
      'meta[property="og:site_name"]',
    ];

    let companyName = '';
    for (const selector of companySelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        companyName = element instanceof HTMLMetaElement ? element.content : element.textContent || '';
        if (companyName.trim()) break;
      }
    }
    
    return {
      jobDescription,
      companyName: companyName.trim(),
      companyDescription: ''
    };
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
      console.log("Starting scrape for URL:", url);

      // Try using Firecrawl edge function first
      try {
        const { data, error } = await supabase.functions.invoke('storyline-firecrawl-scraper', {
          body: { url }
        });

        if (error) {
          console.error('Edge function error:', error);
          throw new Error(`Scraping service error: ${error.message}`);
        }

        if (data?.success) {
          console.log("Firecrawl scraping successful");
          
          if (data.jobDescription) {
            onScrapedContent(data.jobDescription);
          }

          if (onCompanyInfoFound && (data.companyName || data.companyDescription)) {
            onCompanyInfoFound(data.companyName || '', data.companyDescription || '');
          }

          toast({
            title: "Job Scraped Successfully",
            description: "Successfully extracted job information using Firecrawl",
          });
          return;
        } else {
          throw new Error(data?.error || 'Firecrawl scraping failed');
        }
      } catch (firecrawlError) {
        console.warn('Firecrawl failed, trying fallback method:', firecrawlError);
        
        // Fallback to simple CORS proxy scraping
        try {
          const fallbackResult = await fallbackScrape(url);
          
          if (fallbackResult.jobDescription) {
            onScrapedContent(fallbackResult.jobDescription);
          }

          if (onCompanyInfoFound && fallbackResult.companyName) {
            onCompanyInfoFound(fallbackResult.companyName, fallbackResult.companyDescription);
          }

          toast({
            title: "Job Scraped (Fallback)",
            description: "Successfully extracted job information using basic scraping",
          });
          return;
        } catch (fallbackError) {
          console.error('Both scraping methods failed:', fallbackError);
          throw new Error('Unable to scrape this URL. This may be due to JavaScript requirements or access restrictions.');
        }
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
