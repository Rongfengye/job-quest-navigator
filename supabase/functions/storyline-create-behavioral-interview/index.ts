
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './config.ts';
import { RequestBody, InterviewQuestion } from './types.ts';
import { generateSystemPrompt, generateFollowUpSystemPrompt, generateUserPrompt } from './prompts.ts';
import { callSonarAPI } from './sonarClient.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
  if (!perplexityApiKey) {
    throw new Error('Missing Perplexity API key');
  }

  try {
    const requestBody: RequestBody = await req.json();
    console.log('Processing interview question generation request');

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
    } = requestBody;

    const systemPrompt = questionIndex === 0
      ? generateSystemPrompt(jobTitle, companyName, companyDescription)
      : generateFollowUpSystemPrompt(jobTitle, companyName, companyDescription);

    const userPrompt = generateUserPrompt(
      jobTitle,
      jobDescription,
      resumeText,
      companyName,
      companyDescription,
      coverLetterText,
      additionalDocumentsText
    );

    const sonarData = await callSonarAPI(systemPrompt, userPrompt, perplexityApiKey);
    
    if (!sonarData.choices || !sonarData.choices[0] || !sonarData.choices[0].message) {
      console.error('Unexpected response format from Sonar:', sonarData);
      throw new Error('Sonar did not return the expected data structure');
    }

    let parsedContent;
    try {
      const content = sonarData.choices[0].message.content;
      parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
      
      if (!parsedContent.question) {
        console.error('Invalid response structure:', parsedContent);
        throw new Error('Sonar did not return the expected data structure');
      }
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      console.log('Raw response:', sonarData.choices[0].message.content);
      throw new Error('Invalid JSON format in the Sonar response');
    }

    const response: InterviewQuestion = {
      question: parsedContent.question,
      questionIndex: questionIndex
    };

    return new Response(JSON.stringify(response), {
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

