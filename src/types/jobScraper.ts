// Job Scraper types for structured data extraction
export interface ExtractedJobData {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  companyDescription: string;
}

// Response format from storyline-firecrawl-scraper edge function
export interface ScrapedJobResponse {
  success: boolean;
  // Legacy format (backward compatibility)
  jobDescription?: string;
  companyName?: string;
  companyDescription?: string;
  error?: string;
  // NEW: Structured extraction (Phase 1)
  extracted?: ExtractedJobData;
}

// JobScraper component props
export interface JobScraperProps {
  // Legacy callbacks (maintained for backward compatibility)
  onScrapedContent: (content: string) => void;
  onCompanyInfoFound?: (companyName: string, companyDescription: string) => void;
  // NEW: Structured data callback (Phase 2)
  onStructuredDataExtracted?: (data: ExtractedJobData) => void;
  className?: string;
}