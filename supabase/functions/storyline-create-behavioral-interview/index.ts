
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
    
    // Log the request body
    console.log('[DEBUG] Received request body:', JSON.stringify(requestBody, null, 2));
    
    // Check if this is a feedback generation request
    if (requestBody.generateFeedback) {
      console.log('[DEBUG] Processing feedback generation request');
      console.log('[DEBUG] Questions:', JSON.stringify(requestBody.questions || [], null, 2));
      console.log('[DEBUG] Answers:', JSON.stringify(requestBody.answers || [], null, 2));
      
      // Here we would process feedback generation
      // For now, log that this functionality is not yet implemented
      console.error('[ERROR] Feedback generation not yet implemented');
      throw new Error('Feedback generation not yet implemented');
    } else {
      console.log('[DEBUG] Processing interview question generation request');
    }

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
    console.log(`[DEBUG] Job title: ${jobTitle}`);
    console.log(`[DEBUG] Company: ${companyName || 'Not specified'}`);
    console.log(`[DEBUG] Resume length: ${resumeText ? resumeText.length : 0} chars`);
    
    const systemPrompt = questionIndex === 0
      ? generateSystemPrompt(jobTitle, companyName, companyDescription)
      : generateFollowUpSystemPrompt(jobTitle, companyName, companyDescription);

    console.log('[DEBUG] System prompt:', systemPrompt);

    const userPrompt = generateUserPrompt(
      jobTitle,
      jobDescription,
      resumeText,
      companyName,
      companyDescription,
      coverLetterText,
      additionalDocumentsText
    );
    
    console.log('[DEBUG] User prompt length:', userPrompt.length, 'chars');
    
    console.log('[DEBUG] Calling Perplexity Sonar API...');
    const sonarData = await callSonarAPI(systemPrompt, userPrompt, perplexityApiKey);
    console.log('[DEBUG] Received Perplexity response');
    
    if (!sonarData.choices || !sonarData.choices[0] || !sonarData.choices[0].message) {
      console.error('[ERROR] Unexpected response format from Sonar:', JSON.stringify(sonarData, null, 2));
      throw new Error('Sonar did not return the expected data structure');
    }

    let parsedContent;
    try {
      const content = sonarData.choices[0].message.content;
      console.log('[DEBUG] Raw content from Sonar:', typeof content === 'string' ? content : JSON.stringify(content, null, 2));
      
      parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
      
      if (!parsedContent.question) {
        console.error('[ERROR] Invalid response structure:', JSON.stringify(parsedContent, null, 2));
        throw new Error('Sonar did not return the expected data structure');
      }
      
      console.log('[DEBUG] Successfully parsed content');
    } catch (parseError) {
      console.error('[ERROR] Error parsing JSON response:', parseError);
      console.log('[ERROR] Raw response:', sonarData.choices[0].message.content);
      throw new Error('Invalid JSON format in the Sonar response');
    }

    const response: InterviewQuestion = {
      question: parsedContent.question,
      questionIndex: questionIndex
    };
    
    console.log('[DEBUG] Returning response:', JSON.stringify(response, null, 2));

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('[ERROR] Error processing request:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
