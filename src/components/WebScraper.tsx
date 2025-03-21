
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Search } from 'lucide-react';

const WebScraper = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<string | null>(null);
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
      setScrapeResult(null);

      // Use a CORS proxy to bypass CORS restrictions
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
      }

      const data = await response.text();
      setScrapeResult(data);
    } catch (err) {
      console.error('Error scraping website:', err);
      setError(err instanceof Error ? err.message : 'Error scraping website');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-12 px-6 max-w-5xl mx-auto" id="web-scraper">
      <Card className="bg-white shadow-md border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold text-interview-primary">
            Web Content Scraper
          </CardTitle>
          <CardDescription>
            Enter a URL to scrape and view the content of any webpage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="url"
                value={url}
                onChange={handleUrlChange}
                placeholder="https://example.com"
                className="flex-grow"
              />
              <Button 
                onClick={handleScrape} 
                disabled={isLoading}
                className="bg-interview-primary hover:bg-interview-dark gap-2"
              >
                <Search className="h-4 w-4" /> 
                {isLoading ? 'Scraping...' : 'Scrape URL'}
              </Button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            {scrapeResult && (
              <div className="space-y-3">
                <label htmlFor="result" className="block text-sm font-medium text-interview-text-primary">
                  Scraped Content:
                </label>
                <Textarea
                  id="result"
                  value={scrapeResult}
                  readOnly
                  className="h-64 font-mono text-sm"
                />
                <p className="text-xs text-interview-text-light mt-2">
                  Character count: {scrapeResult.length}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default WebScraper;
