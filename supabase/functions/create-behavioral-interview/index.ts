
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

    if (generateFeedback) {
      // Safety check: make sure questions and answers arrays are valid
      if (!Array.isArray(questions) || !Array.isArray(answers)) {
        console.error('Invalid inputs for feedback generation:', { 
          questionsIsArray: Array.isArray(questions), 
          answersIsArray: Array.isArray(answers) 
        });
        throw new Error('Invalid questions or answers data provided for feedback generation');
      }
      
      // Check if we have enough questions and answers to generate feedback
      if (questions.length < 5 || answers.length < 5) {
        console.error('Not enough questions or answers for feedback generation:', { 
          questionsCount: questions.length, 
          answersCount: answers.length 
        });
        throw new Error(`Not enough questions or answers to generate feedback. 
          Questions: ${questions.length}, Answers: ${answers.length}`);
      }

      console.log(`Generating feedback for ${questions.length} questions and ${answers.length} answers`);

      // Make sure we have the same number of questions and answers
      const feedbackLength = Math.min(questions.length, answers.length);
      
      const feedbackPromises = [];
      
      // Only process questions that have corresponding answers
      for (let index = 0; index < feedbackLength; index++) {
        if (!questions[index] || !answers[index]) {
          console.log(`Skipping feedback for index ${index} due to missing question or answer`);
          continue;
        }
        
        const systemPrompt = `You are an expert behavioral interview evaluator for a ${jobTitle || 'professional'} position.
        Your task is to provide detailed, constructive feedback on the candidate's response.
        
        Consider:
        1. Use of the STAR method (Situation, Task, Action, Result)
        2. Relevance to the question asked
        3. Specificity and detail level
        4. Professional communication
        5. Alignment with job requirements
        
        Provide feedback in this format:
        {
          "pros": ["strength 1", "strength 2", ...],
          "cons": ["area for improvement 1", "area for improvement 2", ...],
          "score": <number between 0-100>,
          "suggestions": "specific suggestions for improvement",
          "overall": "brief overall assessment"
        }`;

        console.log(`Processing feedback for question ${index + 1}: ${questions[index].substring(0, 50)}...`);
        console.log(`Processing answer ${index + 1}: ${answers[index].substring(0, 50)}...`);

        const feedbackPromise = fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Question: ${questions[index]}\n\nAnswer: ${answers[index]}` }
            ],
            response_format: { type: "json_object" }
          }),
        }).then(response => response.json())
          .then(data => {
            if (data.error) {
              console.error(`Error from OpenAI for question ${index + 1}:`, data.error);
              // Return a default feedback object if there's an error
              return {
                pros: ["Unable to analyze response"],
                cons: ["Error generating feedback"],
                score: 0,
                suggestions: "Please try again later.",
                overall: "Error in feedback generation"
              };
            }
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
              console.error(`Unexpected response format from OpenAI for question ${index + 1}:`, data);
              // Return a default feedback object
              return {
                pros: ["Unable to analyze response"],
                cons: ["Unexpected response format"],
                score: 0,
                suggestions: "Please try again later.",
                overall: "Error in feedback generation"
              };
            }
            
            try {
              return JSON.parse(data.choices[0].message.content);
            } catch (parseError) {
              console.error(`Error parsing OpenAI response for question ${index + 1}:`, parseError);
              console.log('Raw response:', data.choices[0].message.content);
              // Return a default feedback object
              return {
                pros: ["Unable to analyze response"],
                cons: ["Error parsing feedback"],
                score: 0,
                suggestions: "Please try again later.",
                overall: "Error in feedback generation"
              };
            }
          })
          .catch(error => {
            console.error(`Network error while getting feedback for question ${index + 1}:`, error);
            // Return a default feedback object
            return {
              pros: ["Unable to analyze response"],
              cons: ["Network error"],
              score: 0,
              suggestions: "Please try again later.",
              overall: "Error in feedback generation"
            };
          });
        
        feedbackPromises.push(feedbackPromise);
      }

      // Wait for all feedback to be generated
      const feedbackResults = await Promise.all(feedbackPromises);
      console.log(`Successfully generated ${feedbackResults.length} feedback entries`);

      if (!feedbackResults || feedbackResults.length === 0) {
        throw new Error('Failed to generate any feedback results');
      }

      return new Response(JSON.stringify({ feedback: feedbackResults }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let systemPrompt = '';
    
    if (questionIndex === 0) {
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
    } else {
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
    }

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

    const generatedContent = openAIData.choices[0].message.content;
    console.log('Generated question:', generatedContent.substring(0, 100) + '...');

    let parsedContent;
    try {
      if (typeof generatedContent === 'string') {
        parsedContent = JSON.parse(generatedContent);
      } else {
        parsedContent = generatedContent;
      }
      
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
