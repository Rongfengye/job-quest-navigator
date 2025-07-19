import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    metadata?: {
      title?: string;
      description?: string;
      ogTitle?: string;
      ogDescription?: string;
    };
  };
  error?: string;
}

interface ScrapedJobData {
  success: boolean;
  jobDescription?: string;
  companyName?: string;
  companyDescription?: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl API key not configured' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    console.log(`Scraping URL: ${url}`);

    // Call Firecrawl API
    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown', 'html'],
        includeTags: ['title', 'meta', 'h1', 'h2', 'h3', 'p', 'div', 'span', 'article', 'section'],
        excludeTags: ['script', 'style', 'nav', 'footer', 'header', 'aside'],
        waitFor: 3000, // Wait 3 seconds for dynamic content
      }),
    });

    if (!firecrawlResponse.ok) {
      const errorText = await firecrawlResponse.text();
      console.error('Firecrawl API error:', errorText);
      return new Response(
        JSON.stringify({ success: false, error: `Firecrawl API error: ${firecrawlResponse.status}` }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    const firecrawlData: FirecrawlResponse = await firecrawlResponse.json();

    if (!firecrawlData.success || !firecrawlData.data) {
      return new Response(
        JSON.stringify({ success: false, error: firecrawlData.error || 'Failed to scrape content' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    const { markdown, html, metadata } = firecrawlData.data;
    
    // Extract job description from markdown (preferred) or HTML
    let jobDescription = '';
    if (markdown) {
      // Clean up markdown and extract main content
      jobDescription = markdown
        .replace(/#{1,6}\s/g, '') // Remove markdown headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
        .replace(/\*(.*?)\*/g, '$1') // Remove italic formatting
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links but keep text
        .replace(/`(.*?)`/g, '$1') // Remove code formatting
        .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
        .trim();
    } else if (html) {
      // Parse HTML and extract text content
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Try to find job description containers
      const jobDescSelectors = [
        '[data-testid="jobDescriptionText"]',
        '[data-automation="jobDescription"]',
        '.job-description',
        '.description',
        'article',
        'main',
        '.content'
      ];
      
      let contentElement = null;
      for (const selector of jobDescSelectors) {
        contentElement = doc.querySelector(selector);
        if (contentElement) break;
      }
      
      if (!contentElement) {
        contentElement = doc.body;
      }
      
      jobDescription = contentElement?.textContent || '';
      jobDescription = jobDescription.replace(/\s+/g, ' ').trim();
    }

    // Extract company information
    let companyName = '';
    let companyDescription = '';

    if (metadata) {
      // Try to get company name from metadata
      companyName = metadata.ogTitle || metadata.title || '';
      companyDescription = metadata.ogDescription || metadata.description || '';
      
      // Clean company name from job title patterns
      if (companyName) {
        // Remove common job posting patterns
        companyName = companyName
          .replace(/\s*-\s*.*(job|position|role|career|hiring).*$/i, '')
          .replace(/^.*(at|@)\s+/i, '')
          .trim();
      }
    }

    // If we couldn't get company info from metadata, try parsing from content
    if (!companyName && html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const companySelectors = [
        '[data-testid="company-name"]',
        '.company-name',
        '[itemprop="hiringOrganization"]',
        '.organization',
        '.employer'
      ];
      
      for (const selector of companySelectors) {
        const element = doc.querySelector(selector);
        if (element?.textContent?.trim()) {
          companyName = element.textContent.trim();
          break;
        }
      }
    }

    const result: ScrapedJobData = {
      success: true,
      jobDescription: jobDescription || undefined,
      companyName: companyName || undefined,
      companyDescription: companyDescription || undefined,
    };

    console.log('Scraping completed successfully');
    console.log(`Job description length: ${jobDescription.length}`);
    console.log(`Company name: ${companyName}`);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in storyline-firecrawl-scraper:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});