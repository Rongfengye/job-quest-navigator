
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
      const { userId, skipGeneration, behavioralId, originalBehavioralQuestions } = requestData;

      // Phase 2 & 3: Handle skipGeneration for entry point B
      if (skipGeneration) {
        console.log('Skip generation mode - processing original behavioral questions only');
        
        // Phase 3: Validate that original questions exist
        if (!originalBehavioralQuestions || !Array.isArray(originalBehavioralQuestions) || originalBehavioralQuestions.length === 0) {
          console.error('Skip generation mode but no original behavioral questions provided');
          
          // Phase 3: Enhanced error handling - try to fetch from behavioral interview
          if (behavioralId) {
            try {
              const { data: behavioralData, error: behavioralError } = await supabase
                .from('storyline_behaviorals')
                .select('questions')
                .eq('id', behavioralId)
                .single();
              
              if (behavioralError || !behavioralData?.questions || !Array.isArray(behavioralData.questions)) {
                return new Response(JSON.stringify({
                  error: 'Behavioral interview data not found',
                  message: 'Unable to retrieve original behavioral interview questions. Please return to the feedback page and try again.',
                  returnToFeedback: true,
                  behavioralId: behavioralId
                }), {
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                  status: 404,
                });
              }
              
              // Update requestData with fetched questions
              requestData.originalBehavioralQuestions = behavioralData.questions;
            } catch (error) {
              console.error('Error fetching behavioral interview data:', error);
              return new Response(JSON.stringify({
                error: 'Server error retrieving behavioral data',
                message: 'There was an error retrieving your behavioral interview questions. Please return to the feedback page and try again.',
                returnToFeedback: true,
                behavioralId: behavioralId
              }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
              });
            }
          } else {
            return new Response(JSON.stringify({
              error: 'No original questions available',
              message: 'No behavioral interview questions found to display. Please start from the Create page instead.',
              suggestCreatePage: true
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            });
          }
        }

        // Generate question using skip mode (no Perplexity API call, no usage consumption)
        const parsedContent = await generateQuestion(requestData, perplexityApiKey!);
        
        // No usage increment for skipGeneration mode
        console.log('Skip generation completed - no usage consumed');
        
        return new Response(JSON.stringify(parsedContent), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      // Regular flow - check usage limits for question vault generation
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
