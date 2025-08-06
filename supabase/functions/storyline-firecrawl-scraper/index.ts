
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
  // NEW: Structured extraction
  extracted?: {
    jobTitle: string;
    companyName: string;
    jobDescription: string;
    companyDescription: string;
  };
}

// OpenAI extraction function
async function extractStructuredJobData(scrapedContent: string): Promise<ScrapedJobData['extracted'] | null> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    console.warn('OPENAI_API_KEY not found, skipping structured extraction');
    return null;
  }

  // Skip extraction if content is too short or likely contains only navigation
  if (!scrapedContent || scrapedContent.length < 100) {
    console.log('Content too short for extraction, skipping');
    return null;
  }

  const prompt = `Extract job information from this scraped webpage content. Focus on the actual job posting, ignore navigation/headers/footers.

CONTENT:
${scrapedContent.substring(0, 6000)} ${scrapedContent.length > 6000 ? '...(truncated)' : ''}

Return valid JSON only:
{
  "jobTitle": "actual job position title",
  "companyName": "company name only", 
  "jobDescription": "complete job requirements and responsibilities",
  "companyDescription": "company overview or empty string"
}

Requirements:
- jobTitle: actual position (not "Careers" or page titles)
- companyName: clean company name (not "XYZ Careers" or website elements)
- jobDescription: substantial content (100+ words), ignore navigation
- Extract from job posting content, not website metadata`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Cost-effective model for extraction
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const extractedContent = data.choices?.[0]?.message?.content;
    
    if (!extractedContent) {
      console.log('No content returned from OpenAI');
      return null;
    }

    // Parse the JSON response
    const extracted = JSON.parse(extractedContent);
    
    // Basic validation
    if (!extracted.jobTitle || !extracted.companyName || !extracted.jobDescription) {
      return null;
    }

    if (extracted.jobDescription.length < 100) {
      return null;
    }

    return {
      jobTitle: extracted.jobTitle.trim(),
      companyName: extracted.companyName.trim(),
      jobDescription: extracted.jobDescription.trim(),
      companyDescription: extracted.companyDescription?.trim() || '',
    };

  } catch (error) {
    console.error('Error in OpenAI extraction:', error);
    return null;
  }
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

    // Call Firecrawl API
    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown'],
        excludeTags: ['script', 'style', 'nav', 'footer'],
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
    const rawContent = markdown || html;

    // Try OpenAI extraction first (preferred method)
    let extractedData: ScrapedJobData['extracted'] | null = null;
    if (rawContent) {
      extractedData = await extractStructuredJobData(rawContent);
    }

    // Only process legacy format if OpenAI extraction failed
    let jobDescription = '';
    let companyName = '';
    let companyDescription = '';

    if (!extractedData) {
      // Legacy processing - only when needed
      if (markdown) {
        jobDescription = markdown
          .replace(/#{1,6}\s/g, '')
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/\[(.*?)\]\(.*?\)/g, '$1')
          .replace(/`(.*?)`/g, '$1')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
      } else if (html) {
        const cleanHtml = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        jobDescription = cleanHtml;
      }

      if (metadata) {
        companyName = metadata.ogTitle || metadata.title || '';
        companyDescription = metadata.ogDescription || metadata.description || '';
        
        if (companyName) {
          companyName = companyName
            .replace(/\s*-\s*.*(job|position|role|career|hiring).*$/i, '')
            .replace(/^.*(at|@)\s+/i, '')
            .trim();
        }
      }
    }

    const result: ScrapedJobData = {
      success: true,
      // Legacy format (backward compatibility) - only populated if OpenAI failed
      jobDescription: jobDescription || undefined,
      companyName: companyName || undefined,
      companyDescription: companyDescription || undefined,
      // NEW: Structured extraction (preferred)
      extracted: extractedData || undefined,
    };

    console.log('Scraping completed', extractedData ? 'with structured data' : 'with legacy data only');

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
