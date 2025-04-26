
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get API keys from environment variables
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
  
  try {
    const requestData = await req.json();
    const requestType = requestData.requestType;

    if (requestType === 'GENERATE_QUESTION') {
      const { 
        jobTitle, 
        jobDescription, 
        companyName, 
        companyDescription, 
        resumeText, 
        coverLetterText, 
        additionalDocumentsText
      } = requestData;

      console.log('Received request to generate interview questions');
      console.log('Resume text length:', resumeText?.length || 0);

      // Original OpenAI system prompt (commented out for reference)
      /*
      const systemPrompt = `You are an AI interview coach for current college students and/or recent graduates...
      ${previousSystemPromptContent}
      `;
      */

      // New Perplexity system prompt
      const sonarSystemPrompt = `You are a specialized AI interview coach for college students and recent graduates. Generate interview questions for a ${jobTitle} position.
      ${companyName ? `Company: ${companyName}` : ''}
      ${companyDescription ? `Company Description: ${companyDescription}` : ''}
      
      Based on the provided information, generate 10 interview questions:
      - 5 technical questions focused on entry-level technical skills and problem-solving
      - 5 behavioral questions focused on teamwork, learning, and project experience
      
      Format your response as a JSON object with:
      {
        "technicalQuestions": [
          {
            "question": "string",
            "explanation": "string",
            "modelAnswer": "string (STAR format)",
            "followUp": ["string"]
          }
        ],
        "behavioralQuestions": [
          {
            "question": "string",
            "explanation": "string",
            "modelAnswer": "string (STAR format)",
            "followUp": ["string"]
          }
        ]
      }`;

      // Create the user prompt with all the relevant information
      const userPrompt = `
      Job Title: "${jobTitle}"
      Job Description: "${jobDescription}"
      ${companyName ? `Company Name: "${companyName}"` : ''}
      ${companyDescription ? `Company Description: "${companyDescription}"` : ''}
      
      ${resumeText ? `Resume content: "${resumeText}"` : ''}
      ${coverLetterText ? `Cover Letter content: "${coverLetterText}"` : ''}
      ${additionalDocumentsText ? `Additional Documents content: "${additionalDocumentsText}"` : ''}
      `;

      // Original OpenAI API call (commented out for reference)
      /*
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
      */

      // New Perplexity Sonar API call
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
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2,
          max_tokens: 4000,
          top_p: 0.9,
          frequency_penalty: 1,
          presence_penalty: 0
        }),
      });

      const perplexityData = await perplexityResponse.json();
      console.log('Perplexity API response received');

      if (perplexityData.error) {
        console.error('Perplexity API error:', perplexityData.error);
        throw new Error(`Perplexity API error: ${perplexityData.error.message}`);
      }

      const generatedContent = perplexityData.choices[0].message.content;
      console.log('Generated content length:', generatedContent.length);

      let parsedContent;
      try {
        if (typeof generatedContent === 'string') {
          parsedContent = JSON.parse(generatedContent);
        } else {
          parsedContent = generatedContent;
        }
        
        if (!parsedContent.technicalQuestions && !parsedContent.questions) {
          console.error('Invalid response structure:', parsedContent);
          throw new Error('Perplexity did not return the expected data structure');
        }
        
        if (parsedContent.questions && !parsedContent.technicalQuestions) {
          const transformedContent = {
            technicalQuestions: [],
            behavioralQuestions: []
          };
          
          parsedContent.questions.forEach((q: any) => {
            const questionLower = q.question.toLowerCase();
            
            if (questionLower.includes('technical') || 
                questionLower.includes('tool') || 
                questionLower.includes('skill') ||
                questionLower.includes('technology')) {
              transformedContent.technicalQuestions.push(q);
            } else {
              transformedContent.behavioralQuestions.push(q);
            }
          });
          
          if (transformedContent.technicalQuestions.length === 0 && parsedContent.questions.length > 0) {
            transformedContent.technicalQuestions.push(parsedContent.questions[0]);
          }
          if (transformedContent.behavioralQuestions.length === 0 && parsedContent.questions.length > 1) {
            transformedContent.behavioralQuestions.push(parsedContent.questions[1]);
          }
          
          parsedContent = transformedContent;
        }
        
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        console.log('Raw response:', generatedContent);
        throw new Error('Invalid JSON format in the Perplexity response');
      }

      return new Response(JSON.stringify(parsedContent), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } else if (requestType === 'GENERATE_ANSWER') {
      const { 
        answerText, 
        question, 
        questionType, 
        jobTitle, 
        jobDescription, 
        companyName 
      } = requestData;

      console.log('Received request to generate feedback for answer');
      console.log('Question type:', questionType);
      console.log('Answer length:', answerText?.length || 0);

      // Prepare the system prompt
      const systemPrompt = `You are an expert interview coach specializing in providing constructive feedback on interview answers.
      
      Analyze the candidate's response to the interview question and provide detailed feedback in JSON format with the following sections:
      
      1. "pros" - An array of strings, each highlighting a strength in the answer (be specific about what was good)
      2. "cons" - An array of strings, each highlighting a weakness or area for improvement (be specific and actionable)
      3. "guidelines" - A string with concise guidelines on how to better answer this type of question
      4. "improvementSuggestions" - A string with 2-3 specific suggestions to enhance this particular answer
      5. "score" - A number between 1-100 representing the overall quality of the answer
      
      For ${questionType || 'interview'} questions, focus on:
      ${questionType === 'technical' ? 
        '- Depth of technical knowledge\n- Clarity of explanation\n- Problem-solving approach\n- Relevant experience with technologies' : 
        questionType === 'behavioral' ? 
        '- Structure using the STAR method (Situation, Task, Action, Result)\n- Specific examples that demonstrate relevant soft skills\n- Quantifiable results or impact\n- Self-reflection and learning\n- Relevance to the job requirements\n- Depth of experience\n- Challenges faced and solutions implemented\n- Measurable achievements and impact' :
        '- Clarity and structure\n- Relevance to the question\n- Specific examples\n- Results and impact'}
      
      ${jobTitle ? `For a ${jobTitle} position` : 'For this position'}
      ${companyName ? `at ${companyName}` : ''}
      ${jobDescription ? `consider how well the answer aligns with these job requirements: ${jobDescription}` : ''}
      
      Make your feedback specific, actionable, and balanced. The feedback should help the candidate improve their answer while recognizing what they did well.`;

      // Call the OpenAI API
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
            { role: 'user', content: `Question: ${question}\n\nAnswer: ${answerText}` }
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

      // Extract the feedback from the OpenAI response
      const generatedContent = openAIData.choices[0].message.content;
      console.log('Generated feedback received, parsing JSON');
      
      // Parse the JSON content
      let feedbackContent;
      try {
        feedbackContent = JSON.parse(generatedContent);
        
        // Ensure the structure is valid
        if (!feedbackContent.pros || !feedbackContent.cons) {
          console.error('Invalid feedback structure:', feedbackContent);
          throw new Error('OpenAI did not return the expected data structure');
        }
      } catch (parseError) {
        console.error('Error parsing feedback JSON:', parseError);
        throw new Error('Invalid JSON format in the OpenAI response');
      }

      return new Response(JSON.stringify(feedbackContent), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      throw new Error('Invalid request type specified');
    }

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
