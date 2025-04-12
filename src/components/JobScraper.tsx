
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Globe } from 'lucide-react';

interface JobScraperProps {
  onScrapedContent: (content: string) => void;
}

const JobScraper: React.FC<JobScraperProps> = ({ onScrapedContent }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleScrape = async () => {
    if (!url || !url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

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
      } else {
        throw new Error('Could not extract job description from the page');
      }
    } catch (err) {
      console.error('Error scraping website:', err);
      setError(err instanceof Error ? err.message : 'Error scraping website');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-white shadow-sm border mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold text-interview-primary flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Job Description Scraper
        </CardTitle>
        <CardDescription>
          Enter a job posting URL to automatically extract the job description
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="url"
              value={url}
              onChange={handleUrlChange}
              placeholder="https://example.com/jobs/software-engineer"
              className="flex-grow"
            />
            <Button 
              onClick={handleScrape} 
              disabled={isLoading}
              className="bg-interview-primary hover:bg-interview-dark gap-2"
            >
              <Search className="h-4 w-4" /> 
              {isLoading ? 'Scraping...' : 'Scrape Job'}
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default JobScraper;
