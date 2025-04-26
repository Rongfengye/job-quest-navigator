
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

    const systemPrompt = `You are an AI interview coach for current college students and/or recent graduates. Your task is to generate 10 interview questions for a job candidate applying for a ${jobTitle} position.
    ${companyName ? `The company name is ${companyName}.` : ''}
    ${companyDescription ? `About the company: ${companyDescription}` : ''}
    
    Based on the job description and candidate's resume, generate interview questions that are specifically relevant to:
    1. The technical skills required for this role
    2. Past experiences that match the job requirements and are asked at the entry level (Practical coding experience, teamwork, and project-based learning)
    3. Problem-solving abilities specific to the challenges in this role
    4. Topics students are expected to be familiar with from coursework, internships, or personal projects
    
    For each question, also include:
    - The "modelAnswer" field should provide a well-structured sample response from the candidate's perspective, following the STAR (Situation, Task, Action, Result) format. It should incorporate corporate values relevant to the specific job opportunity, highlight decision-making rationale, and reflect on the impact, learning, and growth—using quantifiable metrics whenever possible. Additionally, the response should align with the company's culture and values to demonstrate a strong fit for the role
    - A "followUp" array that contains 2 follow-up questions for deeper discussion
    
    Format your response as a JSON object with these fields:
    - 'technicalQuestions': An array of question objects related to technical skills, specifically related to foundational concepts (e.g., debugging, database choice, programming languages, learning new tools) (5 questions)
    - 'behavioralQuestions': An array of question objects related to behaviors, past experiences, and soft skills. Focused on teamwork, learning from failure, project experience, communication, or decision-making (5 questions)

    Do not include overly advanced topics like AWS, distributed systems, or enterprise-level architecture unless they are explicitly mentioned in the resume or job description.
    
    Each question object should have:
    - 'question': The main interview question (string)
    - 'explanation': A brief explanation of why this question us relevant for early-career candidates (string)
    - 'modelAnswer': A strong sample response using Situation, Task, Action, Result (string)
    - 'followUp': An array of follow-up questions (array of strings)
    
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

    console.log('Calling OpenAI API with the prompt', userPrompt);

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
      if (!parsedContent.technicalQuestions && !parsedContent.questions) {
        console.error('Invalid response structure:', parsedContent);
        throw new Error('OpenAI did not return the expected data structure');
      }
      
      // If we have a questions array but not the categorized format,
      // transform it to the expected format with categories
      if (parsedContent.questions && !parsedContent.technicalQuestions) {
        const transformedContent = {
          technicalQuestions: [],
          behavioralQuestions: []
        };
        
        // Simple classification based on content
        parsedContent.questions.forEach((q: any) => {
          const questionLower = q.question.toLowerCase();
          
          if (questionLower.includes('technical') || 
              questionLower.includes('tool') || 
              questionLower.includes('skill') ||
              questionLower.includes('technology')) {
            transformedContent.technicalQuestions.push(q);
          } else {
            transformedContent.behavioralQuestions.push(q);
          }
        });
        
        // Ensure each category has at least some questions
        if (transformedContent.technicalQuestions.length === 0 && parsedContent.questions.length > 0) {
          transformedContent.technicalQuestions.push(parsedContent.questions[0]);
        }
        if (transformedContent.behavioralQuestions.length === 0 && parsedContent.questions.length > 1) {
          transformedContent.behavioralQuestions.push(parsedContent.questions[1]);
        }
        
        parsedContent = transformedContent;
      }
      
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      console.log('Raw response:', generatedContent);
      throw new Error('Invalid JSON format in the OpenAI response');
    }

    return new Response(JSON.stringify(parsedContent), {
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
