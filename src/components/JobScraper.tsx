import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Search, Globe, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { JobScraperProps, ScrapedJobResponse } from '@/types/jobScraper';

const JobScraper: React.FC<JobScraperProps> = ({ 
  onScrapedContent, 
  onCompanyInfoFound, 
  onStructuredDataExtracted, 
  className 
}) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [scrapingError, setScrapingError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    // Clear any previous scraping error when URL changes
    if (scrapingError) {
      setScrapingError(null);
    }
  };

  // Progress simulation effect
  useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      setProgressMessage('');
      return;
    }

    const progressMessages = [
      'Connecting to website...',
      'Analyzing webpage structure...',
      'Extracting job content...',
      'AI processing job data...',
      'Extracting job title and company...',
      'Finalizing structured data...'
    ];

    let messageIndex = 0;
    let currentProgress = 0;

    const progressInterval = setInterval(() => {
      setProgress(prevProgress => {
        // Progress simulation logic similar to ProcessingModal
        if (prevProgress >= 95) {
          return prevProgress; // Stay at 95% until completion
        } else if (prevProgress >= 80) {
          return prevProgress + 0.3; // Crawl slowly
        } else if (prevProgress >= 50) {
          return prevProgress + 0.8; // Moderate progress
        } else {
          return prevProgress + 2; // Quick initial progress
        }
      });
    }, 280);

    const messageInterval = setInterval(() => {
      if (messageIndex < progressMessages.length - 1) {
        messageIndex++;
        setProgressMessage(progressMessages[messageIndex]);
      }
    }, 2000); // Slower message changes for 30s timeout

    // Set initial message
    setProgressMessage(progressMessages[0]);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [isLoading]);

  // Fallback scraping function for when Firecrawl fails
  const fallbackScrape = async (url: string) => {
    setProgressMessage('Using fallback scraping method...');
    
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
      setProgress(0);
      setScrapingError(null); // Clear any previous errors
      console.log("Starting scrape for URL:", url);

      // Create a timeout promise - increased to 30s for OpenAI extraction
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Scraping timeout')), 20000);
      });

      // Try using Firecrawl edge function first with timeout
      try {
        const scrapePromise = supabase.functions.invoke('storyline-firecrawl-scraper', {
          body: { url }
        });

        const { data, error } = await Promise.race([scrapePromise, timeoutPromise]) as { data: ScrapedJobResponse; error: any };

        if (error) {
          console.error('Edge function error:', error);
          throw new Error(`Scraping service error: ${error.message}`);
        }

        if (data?.success) {
          console.log("Firecrawl scraping successful");
          console.log("Received data:", { hasExtracted: !!data.extracted, hasCallback: !!onStructuredDataExtracted });
          if (data.extracted) {
            console.log("Structured data available:", data.extracted);
          }
          setProgress(100);
          setProgressMessage('Scraping completed successfully!');
          
          // Priority 1: Try structured data extraction (Phase 2)
          if (data.extracted && onStructuredDataExtracted) {
            console.log("Using structured job data extraction");
            onStructuredDataExtracted({
              jobTitle: data.extracted.jobTitle,
              companyName: data.extracted.companyName,
              jobDescription: data.extracted.jobDescription,
              companyDescription: data.extracted.companyDescription
            });
            
            toast({
              title: "Smart Job Extraction Complete",
              description: "Successfully extracted and auto-filled job title, company, and description",
            });
            return;
          }
          
          // Fallback: Use legacy callbacks for backward compatibility
          console.log("Using legacy job data extraction");
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
        
        // Fallback to simple CORS proxy scraping with timeout
        try {
          const fallbackPromise = fallbackScrape(url);
          const fallbackResult = await Promise.race([fallbackPromise, timeoutPromise]) as any;
          
          setProgress(100);
          setProgressMessage('Fallback scraping completed!');
          
          // Note: Fallback method doesn't have OpenAI extraction, so use legacy callbacks
          console.log("Using fallback scraping - legacy callbacks only");
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
          
          // Show specific message for timeout or scraping failure
          const isTimeout = fallbackError instanceof Error && fallbackError.message === 'Scraping timeout';
          
          setScrapingError(isTimeout 
            ? "This website took too long to respond. Please manually copy and paste the job details from the website below."
            : "This website cannot be automatically scraped. Please manually copy and paste the job details from the website below."
          );
          return;
        }
      }
    } catch (err) {
      console.error('Error scraping website:', err);
      setScrapingError("This website cannot be automatically scraped. Please manually copy and paste the job details from the website below.");
    } finally {
      setIsLoading(false);
      // Keep progress and message visible for a moment after completion
      setTimeout(() => {
        setProgress(0);
        setProgressMessage('');
      }, 2000);
    }
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-3">
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
      
      {/* Scraping Error Warning */}
      {scrapingError && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-yellow-800">
            {scrapingError}
          </span>
        </div>
      )}
      
      {isLoading && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>{progressMessage}</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobScraper;
