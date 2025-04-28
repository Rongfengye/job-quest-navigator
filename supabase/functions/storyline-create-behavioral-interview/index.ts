
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './config.ts';
import { RequestBody, InterviewQuestion } from './types.ts';
import { generateSystemPrompt, generateFollowUpSystemPrompt, generateUserPrompt, generateFeedbackSystemPrompt } from './prompts.ts';
import { callSonarAPI } from './sonarClient.ts';

// Main edge function handler that processes both question generation and feedback requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
  if (!perplexityApiKey) {
    throw new Error('Missing Perplexity API key');
  }

  try {
    const requestBody = await req.json();
    
    // Branch logic: Handle either feedback generation or question generation
    if (requestBody.generateFeedback === true) {
      console.log('Processing interview feedback generation request');
      
      const { questions, answers, jobTitle, companyName, jobDescription } = requestBody;
      
      // Validate we have enough questions and answers for feedback
      if (!questions || !answers || questions.length < 5 || answers.length < 5) {
        throw new Error('Feedback generation requires 5 questions and 5 answers');
      }
      
      // Format the questions and answers for the prompt
      const questionAnswerPairs = questions.map((question: string, index: number) => {
        return `Q${index + 1}: ${question}\nA${index + 1}: ${answers[index]}`;
      }).join('\n\n');
      
      // Generate prompts for feedback analysis
      const systemPrompt = generateFeedbackSystemPrompt(jobTitle, companyName, jobDescription);
      const userPrompt = `Please provide comprehensive feedback on these behavioral interview responses:\n\n${questionAnswerPairs}`;
      
      console.log('Calling Sonar API for feedback generation');
      const sonarData = await callSonarAPI(systemPrompt, userPrompt, perplexityApiKey, true);
      
      // Validate Sonar API response structure
      if (!sonarData.choices || !sonarData.choices[0] || !sonarData.choices[0].message) {
        console.error('Unexpected response format from Sonar:', sonarData);
        throw new Error('Sonar did not return the expected data structure');
      }
      
      // Parse and validate the feedback content
      let parsedContent;
      try {
        const content = sonarData.choices[0].message.content;
        parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
        
        if (!parsedContent.feedback) {
          console.error('Invalid feedback response structure:', parsedContent);
          throw new Error('Sonar did not return the expected feedback data structure');
        }
      } catch (parseError) {
        console.error('Error parsing JSON feedback response:', parseError);
        console.log('Raw response:', sonarData.choices[0].message.content);
        throw new Error('Invalid JSON format in the Sonar feedback response');
      }
      
      // Return the processed feedback
      return new Response(JSON.stringify({ feedback: parsedContent.feedback }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    // Handle question generation (existing flow)
    else {
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

      // Choose appropriate prompt based on whether this is the first question or a follow-up
      const systemPrompt = questionIndex === 0
        ? generateSystemPrompt(jobTitle, companyName, companyDescription)
        : generateFollowUpSystemPrompt(jobTitle, companyName, companyDescription);

      // Generate the user prompt with all available context
      const userPrompt = generateUserPrompt(
        jobTitle,
        jobDescription,
        resumeText,
        companyName,
        companyDescription,
        coverLetterText,
        additionalDocumentsText
      );

      // Call Sonar API to generate the question
      const sonarData = await callSonarAPI(systemPrompt, userPrompt, perplexityApiKey);
      
      // Validate Sonar API response structure
      if (!sonarData.choices || !sonarData.choices[0] || !sonarData.choices[0].message) {
        console.error('Unexpected response format from Sonar:', sonarData);
        throw new Error('Sonar did not return the expected data structure');
      }

      // Parse and validate the generated question
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

      // Format and return the interview question
      const response: InterviewQuestion = {
        question: parsedContent.question,
        questionIndex: questionIndex
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
