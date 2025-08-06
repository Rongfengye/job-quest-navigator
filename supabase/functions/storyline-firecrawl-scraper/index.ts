
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

  // Check for obvious navigation/header content that user feedback mentioned
  const navigationIndicators = [
    'home', 'about', 'contact', 'login', 'sign up', 'privacy policy', 'terms',
    'careers', 'jobs', 'search jobs', 'footer', 'header', 'navigation', 'menu'
  ];
  const contentLower = scrapedContent.toLowerCase();
  const navCount = navigationIndicators.filter(indicator => contentLower.includes(indicator)).length;
  
  if (navCount > 3 && scrapedContent.length < 500) {
    console.log('Content appears to be mostly navigation, skipping extraction');
    return null;
  }

  // Additional check for Meta careers specific issues mentioned in user feedback
  const metaCareersPattern = /metacareers\.com/i;
  if (metaCareersPattern.test(scrapedContent) && scrapedContent.includes('website headers and links')) {
    console.log('Detected Meta careers page with navigation content, enhancing extraction');
  }

  const prompt = `You are an expert at extracting structured job information from scraped web content.

Extract the following information from the scraped job posting content below. The content may include navigation elements, headers, footers, or have content in mixed order - focus only on the actual job posting information.

SCRAPED CONTENT:
---
${scrapedContent.substring(0, 8000)} ${scrapedContent.length > 8000 ? '...(truncated)' : ''}
---

Extract and return ONLY valid JSON in this exact format:
{
  "jobTitle": "exact job title from the posting",
  "companyName": "company name only (no extra words like 'at' or 'careers')",
  "jobDescription": "clean, well-formatted job description with exact text of requirements and responsibilities from raw scraped content, excluding any navigation or footer content",
  "companyDescription": "brief company overview if available in the content, otherwise empty string"
}

CRITICAL REQUIREMENTS:
- jobTitle must be the actual position title (e.g. "Senior Software Engineer", "Product Manager"), NOT page titles like "Careers", "Jobs", "Home", or navigation elements
- companyName should be clean company name only (e.g. "Meta", "Google", "Apple"), remove words like "at", "careers", "jobs", or website elements
- jobDescription should be substantial (at least 100 words) and contain actual job requirements, responsibilities, and qualifications
- IGNORE: navigation links, headers, footers, "Apply now" buttons, social media links, copyright text, website menus
- REORDER: if content appears out of order, reorganize it logically with job title first, then description, then requirements
- If you cannot find legitimate job posting information (only navigation/website content found), return null
- For sites like Meta Careers, LinkedIn, or other job boards, look specifically for the job posting content, not the site structure

EXAMPLES OF WHAT TO IGNORE:
- "Home About Contact Careers" (navigation)
- "© 2024 Company Name" (footer)
- "Sign up for alerts" (website features)
- "Share this job" (social buttons)
- Website headers and links mentioned in user feedback

Return only the JSON object, no additional text or explanation.`;

  try {
    console.log('Making OpenAI extraction request...');
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
        temperature: 0.1, // Low temperature for consistent extraction
        max_tokens: 2000,
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

    console.log('Raw OpenAI response:', extractedContent);

    // Parse the JSON response
    const extracted = JSON.parse(extractedContent);
    
    // Validate the extracted data
    if (!extracted.jobTitle || !extracted.companyName || !extracted.jobDescription) {
      console.log('Incomplete extraction, missing required fields');
      return null;
    }

    // Enhanced validation based on user feedback
    if (extracted.jobDescription.length < 100) {
      console.log('Job description too short, likely not actual job content');
      return null;
    }

    // Check if extracted data looks like navigation (expanded based on user feedback)
    const suspiciousJobTitles = [
      'home', 'careers', 'jobs', 'about', 'contact', 'login', 'sign up',
      'search', 'apply', 'website', 'page', 'site', 'menu', 'navigation'
    ];
    if (suspiciousJobTitles.some(title => extracted.jobTitle.toLowerCase().includes(title))) {
      console.log(`Job title "${extracted.jobTitle}" appears to be navigation, skipping`);
      return null;
    }

    // Check if company name looks suspicious
    const suspiciousCompanyIndicators = ['careers', 'jobs', 'com', 'www', 'http'];
    if (suspiciousCompanyIndicators.some(indicator => extracted.companyName.toLowerCase().includes(indicator))) {
      console.log(`Company name "${extracted.companyName}" appears to be website element, skipping`);
      return null;
    }

    // Check if job description contains mostly navigation text
    const navKeywordsInDescription = navigationIndicators.filter(nav => 
      extracted.jobDescription.toLowerCase().includes(nav)
    ).length;
    
    if (navKeywordsInDescription > 5) {
      console.log('Job description contains too many navigation keywords, likely scraped website structure');
      return null;
    }

    console.log('Successfully extracted structured job data');
    console.log(`Job Title: ${extracted.jobTitle}`);
    console.log(`Company: ${extracted.companyName}`);
    console.log(`Description length: ${extracted.jobDescription.length}`);

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
        formats: ['markdown'],
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

    // Try OpenAI extraction on the scraped content
    let extractedData: ScrapedJobData['extracted'] | null = null;
    if (jobDescription) {
      console.log('Attempting structured extraction with OpenAI...');
      extractedData = await extractStructuredJobData(jobDescription);
    }

    const result: ScrapedJobData = {
      success: true,
      // Legacy format (backward compatibility)
      jobDescription: jobDescription || undefined,
      companyName: companyName || undefined,
      companyDescription: companyDescription || undefined,
      // NEW: Structured extraction (if available)
      extracted: extractedData || undefined,
    };

    console.log('Scraping completed successfully');
    console.log(`Job description length: ${jobDescription.length}`);
    console.log(`Company name: ${companyName}`);
    if (extractedData) {
      console.log('Structured extraction successful');
      console.log(`Extracted job title: ${extractedData.jobTitle}`);
      console.log(`Extracted company: ${extractedData.companyName}`);
    } else {
      console.log('Structured extraction skipped or failed');
    }

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
