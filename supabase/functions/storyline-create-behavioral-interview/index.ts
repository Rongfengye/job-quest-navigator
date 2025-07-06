
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.4.0';
import { generateTextToSpeech } from './audio-generation-helpers.ts';
import { generateFeedbackHelper } from './feedback-logic.ts';
import { generateBehavioralQuestion } from './behavioral-question-generation.ts';

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
      questions = [],
      generateAudio = true,
      voice = 'alloy',
      userId,
      isFirstQuestion = false
    } = requestBody;

    // Check usage limits for behavioral interviews (only for the first question)
    if (isFirstQuestion && userId) {
      console.log('Checking behavioral interview usage limits for user:', userId);
      
      const { data: usageCheck, error: usageError } = await supabase.rpc('check_user_monthly_usage', {
        user_id: userId,
        usage_type: 'behavioral'
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
          message: 'You have reached your monthly limit for behavioral interviews.',
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

    // Upon the submission of the last question, we actually turn this flag on and feedback is prompted for instead
    if (generateFeedback) {
      // Use the imported feedback function with the additional parameters
      const feedbackResults = await generateFeedbackHelper(
        openAIApiKey,
        supabase,
        questions,
        answers,
        jobTitle,
        companyName,
        companyDescription,
        jobDescription,
        resumeText
      );

      // Increment usage count after successful behavioral interview completion
      if (userId) {
        console.log('Incrementing behavioral usage count for user:', userId);
        
        const { data: incrementResult, error: incrementError } = await supabase.rpc('increment_user_monthly_usage', {
          user_id: userId,
          usage_type: 'behavioral'
        });

        if (incrementError) {
          console.error('Error incrementing usage count:', incrementError);
          // Don't fail the request, but log the error
        } else {
          console.log('Usage incremented successfully:', incrementResult);
        }
      }

      return new Response(JSON.stringify({ feedback: feedbackResults }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For questions 1-5, use the modularized question generation function to generate questions
    const parsedContent = await generateBehavioralQuestion(
      openAIApiKey,
      questionIndex,
      jobTitle,
      jobDescription,
      companyName,
      companyDescription,
      resumeText,
      coverLetterText,
      additionalDocumentsText,
      previousQuestions,
      previousAnswers
    );

    // Generate audio for the question if requested
    // We have this here so that the Text and audio is delivered to the front end at the same time
    let audioData = null;
    if (generateAudio && parsedContent.question) {
      try {
        console.log('Generating audio for the question');
        audioData = await generateTextToSpeech(parsedContent.question, voice);
        console.log('Audio generation successful');
      } catch (audioError) {
        console.error('Error generating audio:', audioError);
        // Continue without audio if generation fails
      }
    }

    return new Response(JSON.stringify({
      question: parsedContent.question,
      questionIndex: questionIndex,
      audio: audioData
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
