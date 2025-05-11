
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateQuestion } from "./generate-question.ts";
import { generateAnswer } from "./generate-answer.ts";

export const corsHeaders = {
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
      const parsedContent = await generateQuestion(requestData, perplexityApiKey!);
      
      return new Response(JSON.stringify(parsedContent), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else if (requestType === 'GENERATE_ANSWER') {
      const feedbackContent = await generateAnswer(requestData, openAIApiKey!);

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
