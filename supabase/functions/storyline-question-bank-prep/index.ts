
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

enum RequestType {
  GENERATE_QUESTION = 'GENERATE_QUESTION',
  GENERATE_ANSWER = 'GENERATE_ANSWER'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  try {
    const requestData = await req.json();
    const requestType = requestData.requestType as RequestType;

    if (!requestType) {
      throw new Error('Request type not specified');
    }

    let systemPrompt = '';
    let userPrompt = '';
    let messages = [];

    if (requestType === RequestType.GENERATE_QUESTION) {
      // Original interview questions generation prompt
      systemPrompt = `You are an AI interview question generator specialized in creating relevant questions based on job descriptions and resumes. Your task is to analyze the provided job information and candidate materials to generate a comprehensive set of interview questions.

Based on the candidate's resume/cover letter and the job requirements, create questions that are:
1. Tailored to assess technical skills and knowledge required for the position
2. Designed to evaluate relevant experience and past achievements
3. Focused on assessing problem-solving abilities and approach
4. Appropriate for the candidate's experience level

Format your response as a JSON object with:
- questions: Array of objects (10 questions total)
Each question object should have:
- question: The interview question (string)
- explanation: Why this question is relevant (string)
- modelAnswer: A strong example response (string)
- followUp: Array of follow-up questions (array of strings)`;

      userPrompt = `Job Title: "${requestData.jobTitle}"
      Job Description: "${requestData.jobDescription}"
      ${requestData.resumeText ? `Resume content: "${requestData.resumeText}"` : ''}
      ${requestData.coverLetterText ? `Cover Letter content: "${requestData.coverLetterText}"` : ''}
      ${requestData.additionalDocumentsText ? `Additional Documents content: "${requestData.additionalDocumentsText}"` : ''}`;

    } else if (requestType === RequestType.GENERATE_ANSWER) {
      // Original answer feedback generation prompt
      systemPrompt = `You are an expert interview coach specialized in evaluating interview responses. Your task is to analyze an answer to an interview question and provide detailed, constructive feedback.

Provide feedback in JSON format with:
1. pros: Array of strengths in the response
2. cons: Array of areas for improvement
3. guidelines: Best practices for answering this type of question
4. improvementSuggestions: Specific ways to enhance the response
5. score: Numerical score (1-100) based on overall quality`;

      userPrompt = `Question: ${requestData.question}\n\nAnswer: ${requestData.answerText}`;
    }

    console.log(`Processing ${requestType} request`);
    console.log('Request data:', JSON.stringify(requestData, null, 2));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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

    const openAIData = await response.json();
    console.log('OpenAI API response received');
    
    if (openAIData.error) {
      throw new Error(`OpenAI API error: ${openAIData.error.message}`);
    }

    const generatedContent = openAIData.choices[0].message.content;
    let parsedContent;

    try {
      parsedContent = typeof generatedContent === 'string' ? JSON.parse(generatedContent) : generatedContent;
      
      if (requestType === RequestType.GENERATE_QUESTION && !parsedContent.questions) {
        throw new Error('Invalid response structure: missing questions');
      } else if (requestType === RequestType.GENERATE_ANSWER && (!parsedContent.pros || !parsedContent.cons)) {
        throw new Error('Invalid feedback structure: missing pros or cons');
      }
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
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

