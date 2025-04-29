
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
    console.log('[DEBUG] Received request body:', JSON.stringify(requestBody, null, 2));
    
    // Check if this is a feedback generation request
    if (requestBody.generateFeedback) {
      console.log('[DEBUG] Processing feedback generation request');
      console.log('[DEBUG] Questions count:', requestBody.questions?.length);
      console.log('[DEBUG] Answers count:', requestBody.answers?.length);
      
      // Log the full questions and answers for debugging
      if (requestBody.questions) {
        console.log('[DEBUG] Questions:', JSON.stringify(requestBody.questions));
      }
      if (requestBody.answers) {
        console.log('[DEBUG] Answers:', JSON.stringify(requestBody.answers));
      }
    } else {
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

      console.log(`[DEBUG] Generating question at index: ${questionIndex}`);
      console.log('[DEBUG] Job title:', jobTitle);
      console.log('[DEBUG] Company:', companyName || 'Not specified');
      console.log('[DEBUG] Resume length:', resumeText?.length || 0, 'chars');
      
      if (previousQuestions && previousQuestions.length > 0) {
        console.log('[DEBUG] Previous questions:', JSON.stringify(previousQuestions));
      }
      
      if (previousAnswers && previousAnswers.length > 0) {
        console.log('[DEBUG] Previous answers:', JSON.stringify(previousAnswers));
      }

      const systemPrompt = questionIndex === 0
        ? generateSystemPrompt(jobTitle, companyName, companyDescription)
        : generateFollowUpSystemPrompt(jobTitle, companyName, companyDescription);

      console.log('[DEBUG] System prompt:', systemPrompt);
      console.log('[DEBUG] System prompt length:', systemPrompt.length);
      
      const userPrompt = generateUserPrompt(
        jobTitle,
        jobDescription,
        resumeText,
        companyName,
        companyDescription,
        coverLetterText,
        additionalDocumentsText
      );
      
      console.log('[DEBUG] User prompt length:', userPrompt.length);
      console.log('[DEBUG] Calling Perplexity Sonar API...');

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

      console.log('[DEBUG] Generated question:', parsedContent.question);

      const response: InterviewQuestion = {
        question: parsedContent.question,
        questionIndex: questionIndex
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    
    return new Response(JSON.stringify({ error: "Request type not implemented" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
