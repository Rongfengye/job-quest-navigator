
// Import necessary Deno modules
import "https://deno.land/x/xhr@0.1.0/mod.ts";  // XHR polyfill for Deno
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";  // HTTP server functionality
import { generateQuestion } from "./generate-question.ts";  // Import question generation logic
import { generateAnswer } from "./generate-feedback.ts";  // Import answer/feedback generation logic

// Define CORS headers for cross-origin requests
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Main function that handles incoming HTTP requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get API keys from environment variables
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');  // For feedback generation
  const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');  // For question generation
  
  try {
    // Parse the incoming request data
    const requestData = await req.json();
    const requestType = requestData.requestType;

    // Route the request based on the requestType
    if (requestType === 'GENERATE_QUESTION') {
      // Generate question using Perplexity API
      const parsedContent = await generateQuestion(requestData, perplexityApiKey!);
      
      // Return the generated question with CORS headers
      return new Response(JSON.stringify(parsedContent), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else if (requestType === 'GENERATE_FEEDBACK') {
      // Generate feedback using OpenAI API
      const feedbackContent = await generateAnswer(requestData, openAIApiKey!);

      // Return the generated feedback with CORS headers
      return new Response(JSON.stringify(feedbackContent), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      // Handle invalid request types
      throw new Error('Invalid request type specified');
    }

  } catch (error) {
    // Error handling for any exceptions
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
