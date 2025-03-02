
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { 
      jobTitle, 
      jobDescription, 
      companyName, 
      companyDescription,
      resumePath,
      coverLetterPath,
      additionalDocumentsPath 
    } = await req.json();

    // Get resume content if available
    let resumeContent = '';
    if (resumePath) {
      try {
        // For simplicity, we're just using the path here.
        // In a real implementation, you'd need to extract text from the PDF
        resumeContent = `Resume is available at path: ${resumePath}`;
      } catch (error) {
        console.error('Error getting resume:', error);
      }
    }

    // Same for cover letter
    let coverLetterContent = '';
    if (coverLetterPath) {
      coverLetterContent = `Cover letter is available at path: ${coverLetterPath}`;
    }

    // Prepare the prompt for OpenAI
    const prompt = `
    I need to create interview questions for a job application. Here are the details:
    
    Job Title: ${jobTitle}
    
    Job Description: ${jobDescription}
    
    ${companyName ? `Company Name: ${companyName}` : ''}
    ${companyDescription ? `Company Description: ${companyDescription}` : ''}
    
    ${resumeContent ? `Resume Information: ${resumeContent}` : ''}
    ${coverLetterContent ? `Cover Letter Information: ${coverLetterContent}` : ''}
    
    Based on this information, please generate:
    1. 10 technical interview questions specific to this job role
    2. 5 behavioral questions relevant to the requirements
    3. 3 questions the candidate should ask the interviewer
    4. Preparation tips for this specific interview
    
    Format the response as JSON with the following structure:
    {
      "technicalQuestions": [...],
      "behavioralQuestions": [...],
      "questionsToAsk": [...],
      "preparationTips": [...]
    }
    `;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert career coach and interviewer. Your task is to generate tailored interview questions and preparation material.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const openaiResponse = await response.json();
    let generatedContent;
    
    try {
      // Try to parse the content as JSON
      const contentText = openaiResponse.choices[0].message.content;
      generatedContent = JSON.parse(contentText);
    } catch (error) {
      // If JSON parsing fails, use the raw content
      generatedContent = {
        rawContent: openaiResponse.choices[0].message.content,
      };
    }

    // Log success
    console.log('Successfully generated interview questions');

    // Return the generated content
    return new Response(JSON.stringify(generatedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in generate-interview-questions function:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
