
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('====== FUNCTION INVOKED ======');
  console.log('REQUEST METHOD:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request (CORS preflight)');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Enhanced logging for debugging
    console.log('Request headers:', JSON.stringify(Object.fromEntries(req.headers.entries())));
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    
    // Force log flush
    Deno.stderr.writeSync(new TextEncoder().encode('DEBUG: Beginning request processing\n'));
    
    // Get request body
    let requestData;
    
    try {
      // Clone the request to avoid consuming the body stream
      const clonedReq = req.clone();
      
      // Try to parse body as text first
      const textBody = await clonedReq.text();
      console.log('Raw request body:', textBody.substring(0, 1000)); // Log first 1000 chars
      
      if (!textBody || textBody.trim() === '') {
        throw new Error('Empty request body received');
      }
      
      // Then parse as JSON
      try {
        requestData = JSON.parse(textBody);
        console.log('Parsed JSON data:', JSON.stringify(requestData).substring(0, 500));
      } catch (jsonError) {
        console.error('Failed to parse request body as JSON:', jsonError.message);
        console.error('Raw body that failed to parse:', textBody);
        throw new Error(`Invalid JSON in request body: ${jsonError.message}`);
      }
    } catch (bodyError) {
      console.error('Error reading or parsing request body:', bodyError.message);
      Deno.stderr.writeSync(new TextEncoder().encode(`ERROR: ${bodyError.message}\n`));
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Request body error: ${bodyError.message}` 
        }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    // Check if required fields are present
    const { questionIndex, questionType, questionText, action = "generateQuestions", userInput = "", userThoughts = "", resumeText = "" } = requestData;
    
    if (questionIndex === undefined || !questionType || !questionText) {
      console.error('Missing required fields in request:', JSON.stringify(requestData));
      throw new Error('Missing required fields in request');
    }
    
    console.log(`Processing question #${questionIndex} (${questionType}): ${questionText.substring(0, 100)}`);
    console.log(`Action requested: ${action}`);
    
    // Get the OpenAI API key from environment variables
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured in environment variables');
      throw new Error('OpenAI API key not configured');
    }
    
    if (action === "generateQuestions") {
      return await handleGenerateQuestions(openAIApiKey, questionIndex, questionType, questionText, userInput, resumeText, corsHeaders);
    } else if (action === "processThoughts") {
      return await handleProcessThoughts(openAIApiKey, questionIndex, questionType, questionText, userThoughts, corsHeaders);
    } else {
      throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error("Error in guided-response-generator:", error.message);
    console.error("Error stack:", error.stack);
    Deno.stderr.writeSync(new TextEncoder().encode(`FATAL ERROR: ${error.message}\n`));
    
    return new Response(
      JSON.stringify({ 
        error: error.message, 
        success: false 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

// Handler for generating guiding questions
async function handleGenerateQuestions(openAIApiKey: string, questionIndex: number, questionType: string, questionText: string, userInput: string, resumeText: string, corsHeaders: Record<string, string>) {
  console.log(`User's current input: ${userInput ? userInput.substring(0, 100) + (userInput.length > 100 ? '...' : '') : "No input provided"}`);
  console.log(`Resume text length: ${resumeText ? resumeText.length : 0} characters`);
  
  // Prepare the system prompt for OpenAI - ENSURING WE INCLUDE THE WORD "JSON" IN THE PROMPT
  const systemPrompt = "You're an interview coach that helps candidates come up with personalized responses based on their resume and experience. Ask 5 follow-up questions to help them structure their answer, specifically referencing their background when relevant. Respond strictly in valid JSON format with a 'guidingQuestions' array.";
  
  // Prepare the user prompt - ALSO MAKING SURE TO INCLUDE "JSON" 
  let userPrompt = `Interview Question (${questionType}): ${questionText}\n\nUser's current response: ${userInput || "No response yet"}\n\n`;
  
  // Add resume info if available
  if (resumeText && resumeText.length > 0) {
    userPrompt += `Here is relevant information from the user's resume to help personalize your guidance:\n${resumeText.substring(0, 2000)}\n\n`;
  }
  
  userPrompt += "Please provide 5 guiding questions in JSON format like: { \"guidingQuestions\": [\"Q1\", \"Q2\", ...] }. Make these questions specific to the user's background when possible.";
  
  // Prepare API request
  const openAIRequestPayload = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 1000,
    response_format: { type: "json_object" }
  };
  
  // Log the entire OpenAI request payload for debugging
  console.log('OpenAI API request payload:', JSON.stringify(openAIRequestPayload).substring(0, 500) + '...');
  
  // Call OpenAI API
  console.log('Sending request to OpenAI API...');
  const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openAIApiKey}`
    },
    body: JSON.stringify(openAIRequestPayload)
  });
  
  console.log('OpenAI API response status:', openAIResponse.status);
  
  if (!openAIResponse.ok) {
    console.error('OpenAI API error response status:', openAIResponse.status);
    
    try {
      // Try to get error details as JSON
      const errorData = await openAIResponse.json();
      console.error('OpenAI API error details:', JSON.stringify(errorData));
      throw new Error(`OpenAI API error: ${errorData.error?.message || JSON.stringify(errorData)}`);
    } catch (jsonError) {
      // If JSON parsing fails, try to get error as text
      console.error('Failed to parse error response as JSON, trying text...');
      const errorText = await openAIResponse.text().catch(() => 'Could not read response as text');
      console.error('OpenAI API error text:', errorText.substring(0, 200));
      throw new Error(`OpenAI API error (${openAIResponse.status}): ${errorText.substring(0, 200)}`);
    }
  }
  
  // Parse response from OpenAI
  let openAIData;
  try {
    openAIData = await openAIResponse.json();
    console.log('OpenAI API response received');
  } catch (jsonError) {
    console.error('Error parsing OpenAI response as JSON:', jsonError);
    
    // Try to get response as text if JSON parsing failed
    const responseText = await openAIResponse.clone().text().catch(() => 'Could not read response as text');
    console.error('Response text that failed to parse:', responseText.substring(0, 200));
    throw new Error(`Failed to parse OpenAI response: ${jsonError.message}`);
  }
  
  // Validate response structure
  if (!openAIData.choices || !openAIData.choices[0] || !openAIData.choices[0].message) {
    console.error('Unexpected OpenAI response structure:', JSON.stringify(openAIData).substring(0, 500));
    throw new Error('OpenAI response missing expected data structure');
  }
  
  // Extract the response content
  const responseContent = openAIData.choices[0].message.content;
  console.log('Response content received, length:', responseContent.length);
  
  let parsedResponse;
  try {
    // Parse the JSON response
    parsedResponse = JSON.parse(responseContent);
    console.log('Successfully parsed content as JSON');
    
    // Validate expected structure
    if (!parsedResponse.guidingQuestions || !Array.isArray(parsedResponse.guidingQuestions)) {
      console.warn('Parsed response missing expected guidingQuestions array');
      throw new Error('Invalid response format: missing guidingQuestions array');
    }
  } catch (error) {
    console.error('Error parsing OpenAI response content as JSON:', error);
    
    // Attempt to extract questions from text format as fallback
    try {
      const textLines = responseContent.split(/\n/);
      const possibleQuestions = textLines
        .filter(line => /\d+[\.\)]/.test(line) || /\?/.test(line))
        .map(line => line.replace(/^\d+[\.\)]/, '').trim())
        .filter(line => line.length > 10 && line.endsWith('?'));
      
      if (possibleQuestions.length >= 3) {
        console.log('Extracted questions from text as fallback:', JSON.stringify(possibleQuestions));
        parsedResponse = {
          guidingQuestions: possibleQuestions.slice(0, 5)
        };
      } else {
        // If we couldn't extract questions, use a default fallback
        console.log('Using default fallback questions');
        parsedResponse = {
          guidingQuestions: [
            "What specific experience can you highlight that's relevant to this question?",
            "How can you structure your answer using the STAR method?",
            "What key skills or qualities should you emphasize in your response?",
            "How can you quantify your achievements in this context?",
            "What makes your approach or perspective unique in this situation?"
          ]
        };
      }
    } catch (extractError) {
      console.error('Failed to extract questions as fallback:', extractError);
      // Use default fallback
      parsedResponse = {
        guidingQuestions: [
          "What specific experience can you highlight that's relevant to this question?",
          "How can you structure your answer using the STAR method?",
          "What key skills or qualities should you emphasize in your response?",
          "How can you quantify your achievements in this context?",
          "What makes your approach or perspective unique in this situation?"
        ]
      };
    }
  }
  
  // Return a structured response with guidance
  const response = {
    success: true,
    answer: "",  // No answer generated, just questions
    guidance: {
      guidingQuestions: parsedResponse.guidingQuestions || [],
      questionType: questionType,
      structure: getStructureByQuestionType(questionType)
    }
  };

  console.log('Returning final response with guiding questions:', parsedResponse.guidingQuestions?.length || 0);
  console.log('====== FUNCTION COMPLETED SUCCESSFULLY ======');

  return new Response(
    JSON.stringify(response),
    { 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      } 
    }
  );
}

// New handler for processing thoughts into a structured response
async function handleProcessThoughts(openAIApiKey: string, questionIndex: number, questionType: string, questionText: string, userThoughts: string, corsHeaders: Record<string, string>) {
  console.log(`Processing thoughts for question #${questionIndex}`);
  console.log(`User's thoughts: ${userThoughts.substring(0, 200)}${userThoughts.length > 200 ? '...' : ''}`);
  
  // Prepare the system prompt for OpenAI
  const systemPrompt = "You're an expert interview coach. Your task is to take the user's thoughts and format them into a professional, structured interview answer. Focus on clarity, relevance, and using the STAR method where appropriate. Add specific details and quantifiable achievements if mentioned in their thoughts. Format the answer to sound natural and conversational but polished.";
  
  // Prepare the user prompt
  const userPrompt = `
Interview Question (${questionType}): ${questionText}

The user has shared their thoughts on how to answer this question. Please transform these raw thoughts into a well-structured, professional response that they could use in an interview:

USER'S THOUGHTS:
${userThoughts}

Please create a polished, interview-ready response based on these thoughts. The response should:
1. Be structured with a clear introduction, body, and conclusion
2. Use the STAR method (Situation, Task, Action, Result) if applicable
3. Be conversational yet professional 
4. Be between 150-300 words
5. Focus on highlighting skills, experience, and achievements
6. Eliminate any rambling, repetition, or unclear points from the original thoughts
  `;
  
  // Prepare API request
  const openAIRequestPayload = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 1000
  };
  
  // Log the OpenAI request payload for debugging
  console.log('OpenAI API request payload for thought processing:', JSON.stringify(openAIRequestPayload).substring(0, 500) + '...');
  
  // Call OpenAI API
  console.log('Sending request to OpenAI API for thought processing...');
  const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openAIApiKey}`
    },
    body: JSON.stringify(openAIRequestPayload)
  });
  
  console.log('OpenAI API response status for thought processing:', openAIResponse.status);
  
  if (!openAIResponse.ok) {
    console.error('OpenAI API error response status:', openAIResponse.status);
    
    try {
      // Try to get error details as JSON
      const errorData = await openAIResponse.json();
      console.error('OpenAI API error details:', JSON.stringify(errorData));
      throw new Error(`OpenAI API error: ${errorData.error?.message || JSON.stringify(errorData)}`);
    } catch (jsonError) {
      // If JSON parsing fails, try to get error as text
      console.error('Failed to parse error response as JSON, trying text...');
      const errorText = await openAIResponse.text().catch(() => 'Could not read response as text');
      console.error('OpenAI API error text:', errorText.substring(0, 200));
      throw new Error(`OpenAI API error (${openAIResponse.status}): ${errorText.substring(0, 200)}`);
    }
  }
  
  // Parse response from OpenAI
  let openAIData;
  try {
    openAIData = await openAIResponse.json();
    console.log('OpenAI API response received for thought processing');
  } catch (jsonError) {
    console.error('Error parsing OpenAI response as JSON:', jsonError);
    
    // Try to get response as text if JSON parsing failed
    const responseText = await openAIResponse.clone().text().catch(() => 'Could not read response as text');
    console.error('Response text that failed to parse:', responseText.substring(0, 200));
    throw new Error(`Failed to parse OpenAI response: ${jsonError.message}`);
  }
  
  // Validate response structure
  if (!openAIData.choices || !openAIData.choices[0] || !openAIData.choices[0].message) {
    console.error('Unexpected OpenAI response structure:', JSON.stringify(openAIData).substring(0, 500));
    throw new Error('OpenAI response missing expected data structure');
  }
  
  // Extract the response content
  const generatedResponse = openAIData.choices[0].message.content;
  console.log('Generated response received, length:', generatedResponse.length);
  
  // Return a structured response with the generated answer
  const response = {
    success: true,
    generatedResponse: generatedResponse
  };

  console.log('Returning final response with generated answer');
  console.log('====== FUNCTION COMPLETED SUCCESSFULLY ======');

  return new Response(
    JSON.stringify(response),
    { 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      } 
    }
  );
}

// Helper function to provide structure guidance based on question type
function getStructureByQuestionType(questionType: string) {
  switch (questionType?.toLowerCase()) {
    case 'behavioral':
      return "Consider using the STAR method: Situation, Task, Action, Result.";
    case 'technical':
      return "Structure your answer by: 1) Explaining your understanding of the concept, 2) Discussing relevant experience, 3) Providing a concrete example.";
    case 'experience':
      return "Focus on: 1) Relevant skills, 2) Specific accomplishments, 3) Lessons learned, 4) How it applies to this role.";
    default:
      return "Consider organizing your answer with a clear introduction, detailed examples, and a strong conclusion.";
  }
}
