
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
      
      Your response MUST be a valid JSON object in the following format:
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
          // Removing the response_format parameter as it's causing errors
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
      
      // Log first 100 characters to check format
      console.log('Content preview:', generatedContent.substring(0, 100));

      let parsedContent;
      try {
        // Check if content is already a JSON object
        if (typeof generatedContent === 'object' && generatedContent !== null) {
          parsedContent = generatedContent;
          console.log('Content was already a JSON object');
        } 
        // Try to parse as JSON string
        else if (typeof generatedContent === 'string') {
          // Remove markdown code blocks if present
          let cleanContent = generatedContent;
          if (cleanContent.includes('```json')) {
            cleanContent = cleanContent.replace(/```json/g, '').replace(/```/g, '').trim();
            console.log('Removed markdown code blocks');
          }
          
          parsedContent = JSON.parse(cleanContent);
          console.log('Successfully parsed JSON string');
        } else {
          console.error('Unexpected content type:', typeof generatedContent);
          throw new Error('Content is neither a string nor an object');
        }
        
        // Validate the expected structure
        console.log('Parsed content structure check:', 
          'technicalQuestions' in parsedContent ? 'has technicalQuestions' : 'no technicalQuestions',
          'behavioralQuestions' in parsedContent ? 'has behavioralQuestions' : 'no behavioralQuestions',
          'questions' in parsedContent ? 'has questions' : 'no questions'
        );
        
        if (!parsedContent.technicalQuestions && !parsedContent.behavioralQuestions && !parsedContent.questions) {
          console.error('Invalid response structure:', JSON.stringify(parsedContent).substring(0, 200));
          throw new Error('Perplexity did not return the expected data structure');
        }
        
        // Transform if the response doesn't match our expected structure
        if ((!parsedContent.technicalQuestions || !parsedContent.behavioralQuestions) && parsedContent.questions) {
          console.log('Transforming questions array to separate technical and behavioral arrays');
          
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
          
          // Ensure we have at least some questions
          if (transformedContent.technicalQuestions.length === 0 && parsedContent.questions.length > 0) {
            transformedContent.technicalQuestions.push(parsedContent.questions[0]);
          }
          if (transformedContent.behavioralQuestions.length === 0 && parsedContent.questions.length > 1) {
            transformedContent.behavioralQuestions.push(parsedContent.questions[1]);
          }
          
          parsedContent = transformedContent;
          console.log('Transformed to expected structure');
        }
        
        console.log('Final structure:', 
          'technicalQuestions count:', parsedContent.technicalQuestions?.length || 0,
          'behavioralQuestions count:', parsedContent.behavioralQuestions?.length || 0
        );
        
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        console.log('Raw response:', generatedContent);
        
        // Fallback: Try to extract JSON from text response
        try {
          console.log('Attempting fallback JSON extraction');
          // Attempt to create a basic structure based on the text
          const fallbackStructure = {
            technicalQuestions: [],
            behavioralQuestions: []
          };
          
          // Simple parsing of questions based on headings
          const sections = generatedContent.split(/#{2,}/);
          for (const section of sections) {
            if (section.toLowerCase().includes('technical questions')) {
              // Extract questions from this section
              const questions = section.split(/\d+\.\s+\*\*Question:\*\*/);
              
              for (let i = 1; i < questions.length; i++) { // Start from 1 to skip header
                const parts = questions[i].split(/\*\*Explanation:\*\*/);
                if (parts.length >= 2) {
                  const question = parts[0].trim();
                  const explanation = parts[1].split(/\*\*Model Answer:\*\*/)[0].trim();
                  let modelAnswer = "";
                  let followUp = [];
                  
                  if (parts[1].includes('**Model Answer:**')) {
                    const answerParts = parts[1].split(/\*\*Model Answer:\*\*/);
                    if (answerParts.length >= 2) {
                      modelAnswer = answerParts[1].split(/\*\*Follow-Up:\*\*/)[0].trim();
                      
                      if (answerParts[1].includes('**Follow-Up:**')) {
                        const followUpText = answerParts[1].split(/\*\*Follow-Up:\*\*/)[1].trim();
                        followUp = [followUpText];
                      }
                    }
                  }
                  
                  fallbackStructure.technicalQuestions.push({
                    question,
                    explanation,
                    modelAnswer,
                    followUp
                  });
                }
              }
            } else if (section.toLowerCase().includes('behavioral questions')) {
              // Similar extraction for behavioral questions
              const questions = section.split(/\d+\.\s+\*\*Question:\*\*/);
              
              for (let i = 1; i < questions.length; i++) {
                const parts = questions[i].split(/\*\*Explanation:\*\*/);
                if (parts.length >= 2) {
                  const question = parts[0].trim();
                  const explanation = parts[1].split(/\*\*Model Answer:\*\*/)[0].trim();
                  let modelAnswer = "";
                  let followUp = [];
                  
                  if (parts[1].includes('**Model Answer:**')) {
                    const answerParts = parts[1].split(/\*\*Model Answer:\*\*/);
                    if (answerParts.length >= 2) {
                      modelAnswer = answerParts[1].split(/\*\*Follow-Up:\*\*/)[0].trim();
                      
                      if (answerParts[1].includes('**Follow-Up:**')) {
                        const followUpText = answerParts[1].split(/\*\*Follow-Up:\*\*/)[1].trim();
                        followUp = [followUpText];
                      }
                    }
                  }
                  
                  fallbackStructure.behavioralQuestions.push({
                    question,
                    explanation,
                    modelAnswer,
                    followUp
                  });
                }
              }
            }
          }
          
          if (fallbackStructure.technicalQuestions.length === 0 && fallbackStructure.behavioralQuestions.length === 0) {
            throw new Error('Could not extract questions from response');
          }
          
          parsedContent = fallbackStructure;
          console.log('Created fallback structure:', 
            'technicalQuestions:', parsedContent.technicalQuestions.length,
            'behavioralQuestions:', parsedContent.behavioralQuestions.length
          );
        } catch (fallbackError) {
          console.error('Fallback extraction also failed:', fallbackError);
          throw new Error('Invalid JSON format in the Perplexity response');
        }
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
