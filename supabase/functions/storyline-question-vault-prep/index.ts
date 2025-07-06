
// Import necessary Deno modules
import "https://deno.land/x/xhr@0.1.0/mod.ts";  // XHR polyfill for Deno
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";  // HTTP server functionality
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.4.0';
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
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Parse the incoming request data
    const requestData = await req.json();
    const requestType = requestData.requestType;

    // Route the request based on the requestType
    if (requestType === 'GENERATE_QUESTION') {
      const { userId } = requestData;

      // Check usage limits for question vault generation
      if (userId) {
        console.log('Checking question vault usage limits for user:', userId);
        
        const { data: usageCheck, error: usageError } = await supabase.rpc('check_user_monthly_usage', {
          user_id: userId,
          usage_type: 'question_vault'
        });

        if (usageError) {
          console.error('Error checking usage limits:', usageError);
          return new Response(JSON.stringify({ 
            error: 'Failed to check usage limits',
            details: usageError.message 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          });
        }

        console.log('Usage check result:', usageCheck);

        if (!usageCheck.canProceed) {
          return new Response(JSON.stringify({
            error: 'Usage limit exceeded',
            message: 'You have reached your monthly limit for question vault generation.',
            usageInfo: {
              current: usageCheck.currentCount,
              limit: usageCheck.limit,
              remaining: usageCheck.remaining,
              isPremium: usageCheck.isPremium
            }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 429, // Too Many Requests
          });
        }
      }

      // Generate question using Perplexity API
      const parsedContent = await generateQuestion(requestData, perplexityApiKey!);
      
      // Increment usage count after successful question generation
      if (userId) {
        console.log('Incrementing question vault usage count for user:', userId);
        
        const { data: incrementResult, error: incrementError } = await supabase.rpc('increment_user_monthly_usage', {
          user_id: userId,
          usage_type: 'question_vault'
        });

        if (incrementError) {
          console.error('Error incrementing usage count:', incrementError);
          // Don't fail the request, but log the error
        } else {
          console.log('Usage incremented successfully:', incrementResult);
        }
      }
      
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
