
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
      // Question generation logic
      systemPrompt = `You are an AI interview coach for current college students and/or recent graduates. Your task is to generate 10 interview questions for a job candidate applying for a ${requestData.jobTitle} position.
      ${requestData.companyName ? `The company name is ${requestData.companyName}.` : ''}
      ${requestData.companyDescription ? `About the company: ${requestData.companyDescription}` : ''}
      
      Based on the job description and candidate's resume, generate interview questions that are specifically relevant to:
      1. The technical skills required for this role
      2. Past experiences that match the job requirements and are asked at the entry level
      3. Problem-solving abilities specific to the challenges in this role
      4. Topics students are expected to be familiar with from coursework, internships, or personal projects
      
      Format your response as a JSON object with:
      - 'technicalQuestions': Array of question objects (5 questions)
      - 'behavioralQuestions': Array of question objects (5 questions)
      
      Each question object should have:
      - 'question': The main interview question (string)
      - 'explanation': Why this question is relevant (string)
      - 'modelAnswer': A strong sample response using STAR format (string)
      - 'followUp': Array of follow-up questions (array of strings)`;

      userPrompt = `Job Title: "${requestData.jobTitle}"
      Job Description: "${requestData.jobDescription}"
      ${requestData.resumeText ? `Resume content: "${requestData.resumeText}"` : ''}
      ${requestData.coverLetterText ? `Cover Letter content: "${requestData.coverLetterText}"` : ''}
      ${requestData.additionalDocumentsText ? `Additional Documents content: "${requestData.additionalDocumentsText}"` : ''}`;

    } else if (requestType === RequestType.GENERATE_ANSWER) {
      // Answer feedback logic
      systemPrompt = `You are an expert interview coach specializing in providing constructive feedback on interview answers.
    
      Analyze the candidate's response to the interview question and provide detailed feedback in JSON format with:
      1. "pros" - Array of strings highlighting strengths
      2. "cons" - Array of strings highlighting areas for improvement
      3. "guidelines" - String with concise guidelines for this type of question
      4. "improvementSuggestions" - String with 2-3 specific suggestions
      5. "score" - Number between 1-100 for overall quality
      
      ${requestData.questionType === 'technical' ? 
        'Focus on technical knowledge, clarity, problem-solving approach, and relevant experience' : 
        requestData.questionType === 'behavioral' ? 
        'Focus on STAR method, specific examples, quantifiable results, and relevance to job requirements' :
        'Focus on clarity, structure, relevance, and specific examples'}`;

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
      
      if (requestType === RequestType.GENERATE_QUESTION && !parsedContent.technicalQuestions) {
        // Transform legacy format if needed
        if (parsedContent.questions) {
          parsedContent = {
            technicalQuestions: parsedContent.questions.filter((q: any) => {
              const questionLower = q.question.toLowerCase();
              return questionLower.includes('technical') || 
                     questionLower.includes('tool') || 
                     questionLower.includes('skill') ||
                     questionLower.includes('technology');
            }),
            behavioralQuestions: parsedContent.questions.filter((q: any) => {
              const questionLower = q.question.toLowerCase();
              return !questionLower.includes('technical') && 
                     !questionLower.includes('tool') && 
                     !questionLower.includes('skill') &&
                     !questionLower.includes('technology');
            })
          };
        } else {
          throw new Error('Invalid response structure: missing questions');
        }
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
