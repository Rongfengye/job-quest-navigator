
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleGenerateQuestions } from './handle-generate-questions.ts';
import { handleProcessThoughts } from './handle-process-thoughts.ts';

export const corsHeaders = {
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
    const { 
      questionIndex, 
      questionType, 
      questionText, 
      action = "generateQuestions", 
      userInput = "", 
      userThoughts = "", 
      resumeText = "",
      previousFeedback = null,
      previousResponse = null
    } = requestData;
    
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
      return await handleGenerateQuestions(openAIApiKey, questionIndex, questionType, questionText, userInput, resumeText, previousFeedback, corsHeaders);
    } else if (action === "processThoughts") {
      return await handleProcessThoughts(openAIApiKey, questionIndex, questionType, questionText, userThoughts, previousResponse, corsHeaders);
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
