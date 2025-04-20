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
      generateFeedback = false, // New flag to indicate if we should generate feedback
      answers = [], // Array of all answers to generate feedback for
      questions = [] // Array of all questions to generate feedback for
    } = await req.json();

    console.log('Request type:', generateFeedback ? 'Feedback Generation' : 'Question Generation');

    if (generateFeedback) {
      const feedbackPromises = questions.map(async (question, index) => {
        const systemPrompt = `You are an expert behavioral interview evaluator for a ${jobTitle} position.
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
              { role: 'user', content: `Question: ${question}\n\nAnswer: ${answers[index]}` }
            ],
            response_format: { type: "json_object" }
          }),
        });

        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
      });

      const feedbackResults = await Promise.all(feedbackPromises);
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
