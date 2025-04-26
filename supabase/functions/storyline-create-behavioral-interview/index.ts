
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.4.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const requestBody = await req.json();
    console.log('Request type:', requestBody.generateFeedback ? 'Feedback Generation' : 'Question Generation');

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
      generateFeedback = false,
      answers = [],
      questions = []
    } = requestBody;

    let systemPrompt = '';
    let sonarSystemPrompt = '';
    
    if (questionIndex === 0) {
      /* OpenAI System Prompt
      systemPrompt = `You are an experienced interviewer for a ${jobTitle} position.
      ${companyName ? `The company name is ${companyName}.` : ''}
      ${companyDescription ? `About the company: ${companyDescription}` : ''}
      
      Based on the job description and candidate's resume, generate a thought-provoking behavioral interview question that:
      1. Assesses the candidate's past experiences relevant to this role
      2. Helps evaluate their soft skills and cultural fit
      3. Follows the format of "Tell me about a time when..." or similar open-ended behavioral question
      4. Is specific enough to elicit a detailed STAR (Situation, Task, Action, Result) response
      
      Format your response as a JSON object with:
      - 'question': The main interview question (string)`;
      */

      // New Sonar System Prompt
      sonarSystemPrompt = `You are an experienced interviewer for a ${jobTitle} position.
      ${companyName ? `The company name is ${companyName}.` : ''}
      ${companyDescription ? `About the company: ${companyDescription}` : ''}
      
      Based on the job description and candidate's resume, generate a thought-provoking behavioral interview question. Your response MUST be a JSON object with a 'question' field containing the interview question.
      
      The question should:
      1. Assess the candidate's past experiences relevant to this role
      2. Help evaluate their soft skills and cultural fit
      3. Follow the format of "Tell me about a time when..." or similar open-ended behavioral question
      4. Be specific enough to elicit a detailed STAR (Situation, Task, Action, Result) response`;
    } else {
      /* OpenAI System Prompt
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
      
      Format your response as a JSON object with:
      - 'question': The main interview question (string)`;
      */

      // New Sonar System Prompt
      sonarSystemPrompt = `You are an experienced interviewer for a ${jobTitle} position conducting a behavioral interview.
      ${companyName ? `The company name is ${companyName}.` : ''}
      ${companyDescription ? `About the company: ${companyDescription}` : ''}
      
      Previous conversation:
      ${previousQuestions.map((q, i) => 
        `Question ${i+1}: ${q}\nAnswer: ${previousAnswers[i] || "No answer provided"}`
      ).join('\n\n')}
      
      Generate the next behavioral interview question based on this history, the job description, and resume. Your response MUST be a JSON object with a 'question' field containing the interview question.
      
      The question should:
      1. Build upon the previous conversation naturally
      2. Explore a different aspect of the candidate's experience not yet covered
      3. Help assess their fit for this specific role
      4. Be specific enough to elicit a detailed STAR (Situation, Task, Action, Result) response`;
    }

    /* OpenAI User Prompt
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
    */

    // New Sonar User Prompt
    const sonarUserPrompt = `
    Job Title: "${jobTitle}"
    Job Description: "${jobDescription}"
    ${companyName ? `Company Name: "${companyName}"` : ''}
    ${companyDescription ? `Company Description: "${companyDescription}"` : ''}
    
    ${resumeText ? `Resume content: "${resumeText}"` : ''}
    ${coverLetterText ? `Cover Letter content: "${coverLetterText}"` : ''}
    ${additionalDocumentsText ? `Additional Documents content: "${additionalDocumentsText}"` : ''}
    
    ${questionIndex > 0 ? 'Generate the next question in the interview sequence, based on the conversation history.' : 'Generate the first behavioral interview question for this candidate.'}
    `;

    // Define JSON schema for Sonar response
    const responseSchema = {
      "type": "object",
      "properties": {
        "question": {
          "type": "string",
          "description": "The behavioral interview question"
        }
      },
      "required": ["question"]
    };

    console.log('Calling Perplexity Sonar API');

    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          { role: 'system', content: sonarSystemPrompt },
          { role: 'user', content: sonarUserPrompt }
        ],
        temperature: 0.2,
        max_tokens: 4000,
        top_p: 0.9,
        frequency_penalty: 1,
        presence_penalty: 0,
        response_format: {
          "type": "json_schema",
          "json_schema": { "schema": responseSchema }
        }
      }),
    });

    if (!perplexityResponse.ok) {
      const error = await perplexityResponse.text();
      throw new Error(`Perplexity API error: ${error}`);
    }

    const sonarData = await perplexityResponse.json();
    console.log('Sonar API response received');
    
    if (!sonarData.choices || !sonarData.choices[0] || !sonarData.choices[0].message) {
      console.error('Unexpected response format from Sonar:', sonarData);
      throw new Error('Sonar did not return the expected data structure');
    }

    let parsedContent;
    try {
      const content = sonarData.choices[0].message.content;
      if (typeof content === 'string') {
        parsedContent = JSON.parse(content);
      } else {
        parsedContent = content;
      }
      
      if (!parsedContent.question) {
        console.error('Invalid response structure:', parsedContent);
        throw new Error('Sonar did not return the expected data structure');
      }
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      console.log('Raw response:', sonarData.choices[0].message.content);
      throw new Error('Invalid JSON format in the Sonar response');
    }

    return new Response(JSON.stringify({
      question: parsedContent.question,
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
