
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
      console.error('FIRECRAWL_API_KEY environment variable not found');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl API key not configured' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    console.log(`Scraping URL: ${url}`);
    console.log('Using Firecrawl API key:', firecrawlApiKey.substring(0, 10) + '...');

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
        waitFor: 1000,
      }),
    });

    if (!firecrawlResponse.ok) {
      const errorText = await firecrawlResponse.text();
      console.error('Firecrawl API error:', errorText);
      return new Response(
        JSON.stringify({ success: false, error: `Firecrawl API error: ${firecrawlResponse.status} - ${errorText}` }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    const firecrawlData: FirecrawlResponse = await firecrawlResponse.json();
    console.log('Firecrawl response:', JSON.stringify(firecrawlData, null, 2));

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
      const cleanHtml = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      jobDescription = cleanHtml;
    }

    // Extract company information
    let companyName = '';
    let companyDescription = '';

    if (metadata) {
      companyName = metadata.ogTitle || metadata.title || '';
      companyDescription = metadata.ogDescription || metadata.description || '';
      
      // Clean company name from job title patterns
      if (companyName) {
        companyName = companyName
          .replace(/\s*-\s*.*(job|position|role|career|hiring).*$/i, '')
          .replace(/^.*(at|@)\s+/i, '')
          .trim();
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
