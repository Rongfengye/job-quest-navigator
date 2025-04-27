
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

    // Add retry logic for more reliability
    let sonarData;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        console.log(`Attempt ${attempts + 1} to call Sonar API`);
        sonarData = await callSonarAPI(systemPrompt, userPrompt, perplexityApiKey);
        
        if (sonarData.choices && 
            sonarData.choices[0] && 
            sonarData.choices[0].message && 
            sonarData.choices[0].message.content) {
          break; // Successfully got data
        } else {
          console.log('Received incomplete response from Sonar, retrying...');
          attempts++;
        }
      } catch (apiError) {
        console.error(`API call attempt ${attempts + 1} failed:`, apiError);
        attempts++;
        if (attempts >= maxAttempts) throw apiError;
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (!sonarData || !sonarData.choices || !sonarData.choices[0] || !sonarData.choices[0].message) {
      console.error('Unexpected response format from Sonar:', sonarData);
      throw new Error('Sonar did not return the expected data structure');
    }

    let parsedContent;
    let questionText = '';
    
    try {
      const content = sonarData.choices[0].message.content;
      
      // Handle different response formats
      if (typeof content === 'string') {
        // If it's a string, attempt to parse as JSON
        try {
          parsedContent = JSON.parse(content);
        } catch (jsonError) {
          // If it's not valid JSON but contains a question, extract it
          console.log('Content is not valid JSON, attempting to extract question');
          const questionMatch = content.match(/["']?question["']?\s*:\s*["']([^"']+)["']/i);
          if (questionMatch && questionMatch[1]) {
            questionText = questionMatch[1];
            console.log('Extracted question from text:', questionText);
            parsedContent = { question: questionText };
          } else {
            // If we can't extract a question, use the content directly if it looks like a question
            if (content.includes('?')) {
              questionText = content.trim();
              console.log('Using content directly as question:', questionText);
              parsedContent = { question: questionText };
            } else {
              throw new Error('Could not extract question from response');
            }
          }
        }
      } else {
        // If it's already a parsed object
        parsedContent = content;
      }
      
      if (!parsedContent.question) {
        console.error('Invalid response structure:', parsedContent);
        throw new Error('Sonar did not return a question in the expected format');
      }
      
      // Validate question is not empty and is a reasonable length
      if (typeof parsedContent.question !== 'string' || 
          parsedContent.question.trim().length < 10 ||
          parsedContent.question.trim().length > 500) {
        console.error('Question validation failed:', parsedContent.question);
        throw new Error('Generated question is invalid or inappropriate length');
      }
      
      // Ensure the question ends with a question mark if it doesn't already
      if (!parsedContent.question.trim().endsWith('?')) {
        parsedContent.question = parsedContent.question.trim() + '?';
      }
      
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      console.log('Raw response:', sonarData.choices[0].message.content);
      
      // Fallback to a default question if all else fails
      const fallbackQuestions = [
        `Tell me about a time when you had to overcome a significant challenge at work. This was for position: ${jobTitle} at ${companyName || 'the company'}.`,
        `Can you describe a situation where you demonstrated leadership skills? This relates to the ${jobTitle} position.`,
        `How have you handled conflicts with team members in the past? This is relevant for the ${jobTitle} role.`,
        `Tell me about a project you're particularly proud of that demonstrates skills needed for this ${jobTitle} position.`,
        `How do you prioritize tasks when dealing with multiple deadlines?`
      ];
      
      // Use a different fallback question based on the question index
      const fallbackIndex = questionIndex % fallbackQuestions.length;
      parsedContent = { question: fallbackQuestions[fallbackIndex] };
      
      console.log(`Using fallback question ${fallbackIndex}:`, parsedContent.question);
    }

    const response: InterviewQuestion = {
      question: parsedContent.question,
      questionIndex: questionIndex
    };
    
    console.log(`Successfully generated question for index ${questionIndex}`);

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
