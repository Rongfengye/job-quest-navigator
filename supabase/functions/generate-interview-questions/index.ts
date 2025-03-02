
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.4.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get API keys from environment variables
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const {
      jobTitle,
      jobDescription,
      companyName,
      companyDescription,
      resumeText,
      coverLetterText,
      additionalDocumentsText,
      resumePath,
      coverLetterPath,
      additionalDocumentsPath,
    } = await req.json();

    console.log('Received request with jobTitle:', jobTitle);
    console.log('Job description length:', jobDescription?.length || 0);
    console.log('Resume text length:', resumeText?.length || 0);

    // Prepare the prompt
    const systemPrompt = `You are an AI interview coach. Your task is to generate 10 interview questions for a job candidate applying for a ${jobTitle} position.
    ${companyName ? `The company name is ${companyName}.` : ''}
    ${companyDescription ? `About the company: ${companyDescription}` : ''}
    
    Based on the job description and candidate's resume, generate interview questions that are specifically relevant to:
    1. The technical skills required for this role
    2. Past experiences that match the job requirements
    3. Problem-solving abilities specific to the challenges in this role
    
    For each question, also include:
    - A "modelAnswer" field that provides a good sample answer from the candidate's perspective
    - A "followUp" array that contains 2 follow-up questions for deeper discussion
    
    Format your response as a JSON object with a 'questions' array. Each question in the array should have these fields:
    - 'question': The main interview question
    - 'modelAnswer': A sample answer from the candidate's perspective
    - 'followUp': An array of 2 follow-up questions
    
    Ensure the questions are tailored to reflect the intersection of the candidate's experience and the job requirements.`;

    // Create the user prompt with all the relevant information
    const userPrompt = `
    Job Title: "${jobTitle}"
    Job Description: "${jobDescription}"
    ${companyName ? `Company Name: "${companyName}"` : ''}
    ${companyDescription ? `Company Description: "${companyDescription}"` : ''}
    
    ${resumeText ? `Resume content: "${resumeText}"` : ''}
    ${coverLetterText ? `Cover Letter content: "${coverLetterText}"` : ''}
    ${additionalDocumentsText ? `Additional Documents content: "${additionalDocumentsText}"` : ''}
    `;

    console.log('Calling OpenAI API...');

    // Call the OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    const openAIData = await openAIResponse.json();
    console.log('OpenAI API response received');

    if (openAIData.error) {
      console.error('OpenAI API error:', openAIData.error);
      throw new Error(`OpenAI API error: ${openAIData.error.message}`);
    }

    // Extract the generated text from the OpenAI response
    const generatedContent = openAIData.choices[0].message.content;
    console.log('Generated content length:', generatedContent.length);

    return new Response(JSON.stringify(generatedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
