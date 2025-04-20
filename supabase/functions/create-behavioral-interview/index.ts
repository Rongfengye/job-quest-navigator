
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
      previousQuestions,
      previousAnswers,
      questionIndex,
    } = await req.json();

    console.log('Generating question at index:', questionIndex);
    console.log('Job title:', jobTitle);
    console.log('Resume text length:', resumeText?.length || 0);
    console.log('Previous questions count:', previousQuestions?.length || 0);

    // Define our system prompt based on what we're generating
    let systemPrompt = '';
    
    if (questionIndex === 0) {
      // First question - use information from resume and job description
      systemPrompt = `You are an experienced interviewer for a ${jobTitle} position.
      ${companyName ? `The company name is ${companyName}.` : ''}
      ${companyDescription ? `About the company: ${companyDescription}` : ''}
      
      Based on the job description and candidate's resume, generate a thought-provoking behavioral interview question that:
      1. Assesses the candidate's past experiences relevant to this role
      2. Helps evaluate their soft skills and cultural fit
      3. Follows the format of "Tell me about a time when..." or similar open-ended behavioral question
      4. Is specific enough to elicit a detailed STAR (Situation, Task, Action, Result) response
      
      Also include:
      - A brief explanation of why this question is relevant for this role (not shown to the candidate)
      - 2-3 key points that a strong answer should address
      
      Format your response as a JSON object with:
      - 'question': The main interview question (string)
      - 'explanation': Why this question is important for this role (string)
      - 'keyPoints': Array of points that a strong answer would cover (array of strings)`;
    } else {
      // Follow-up questions - consider previous questions and answers
      systemPrompt = `You are an experienced interviewer for a ${jobTitle} position conducting a behavioral interview.
      ${companyName ? `The company name is ${companyName}.` : ''}
      ${companyDescription ? `About the company: ${companyDescription}` : ''}
      
      You have already asked the following questions and received these answers:
      ${previousQuestions.map((q, i) => 
        `Question ${i+1}: ${q}\nAnswer: ${previousAnswers[i] || "No answer provided"}`
      ).join('\n\n')}
      
      Based on this conversation history, the job description, and candidate's resume, generate the next behavioral interview question that:
      1. Builds upon the previous conversation naturally
      2. Explores a different aspect of the candidate's experience or skill set not yet covered
      3. Helps assess their fit for this specific role
      4. Is specific enough to elicit a detailed STAR (Situation, Task, Action, Result) response
      
      Make your question feel like a natural follow-up to the previous conversation, as if this were a real interview flow.
      
      Also include:
      - A brief explanation of why this question is relevant at this point in the interview (not shown to the candidate)
      - 2-3 key points that a strong answer should address
      
      Format your response as a JSON object with:
      - 'question': The main interview question (string)
      - 'explanation': Why this question is appropriate now (string)
      - 'keyPoints': Array of points that a strong answer would cover (array of strings)`;
    }

    // Create the user prompt with all the relevant information
    const userPrompt = `
    Job Title: "${jobTitle}"
    Job Description: "${jobDescription}"
    ${companyName ? `Company Name: "${companyName}"` : ''}
    ${companyDescription ? `Company Description: "${companyDescription}"` : ''}
    
    ${resumeText ? `Resume content: "${resumeText}"` : ''}
    ${coverLetterText ? `Cover Letter content: "${coverLetterText}"` : ''}
    ${additionalDocumentsText ? `Additional Documents content: "${additionalDocumentsText}"` : ''}
    
    ${questionIndex > 0 ? 'Please generate the next question in the interview sequence, based on the conversation history provided in the system prompt.' : 'Please generate the first behavioral interview question for this candidate.'}
    `;

    console.log('Calling OpenAI API');

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
    console.log('Generated question:', generatedContent.substring(0, 100) + '...');

    // Parse the JSON content
    let parsedContent;
    try {
      // If it's a string, parse it
      if (typeof generatedContent === 'string') {
        parsedContent = JSON.parse(generatedContent);
      } else {
        // If it's already an object, use it directly
        parsedContent = generatedContent;
      }
      
      // Validate the structure
      if (!parsedContent.question) {
        console.error('Invalid response structure:', parsedContent);
        throw new Error('OpenAI did not return the expected data structure');
      }
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      console.log('Raw response:', generatedContent);
      throw new Error('Invalid JSON format in the OpenAI response');
    }

    return new Response(JSON.stringify({
      question: parsedContent.question,
      explanation: parsedContent.explanation || '',
      keyPoints: parsedContent.keyPoints || [],
      questionIndex: questionIndex
    }), {
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
