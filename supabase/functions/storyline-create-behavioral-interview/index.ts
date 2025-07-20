
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.4.0';
import { generateTextToSpeech } from './audio-generation-helpers.ts';
import { generateFeedbackHelper } from './feedback-logic.ts';
import { generateBehavioralQuestion, extractRelevantTopics } from './behavioral-question-generation.ts';

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
      isFirstQuestion = false,
      extractedTopics = [],
      askedTopics = [],
      topicFollowUpCounts = {},
      existingBehavioralId
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

      // Increment usage count after successful behavioral interview initialization
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

      return new Response(JSON.stringify({ feedback: feedbackResults }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract topics on first question if not already provided
    let currentExtractedTopics = extractedTopics;
    let currentAskedTopics = askedTopics;
    let currentTopicFollowUpCounts = topicFollowUpCounts;

    if (questionIndex === 0 && extractedTopics.length === 0) {
      console.log('Extracting relevant topics for first question');
      const topicResults = await extractRelevantTopics(
        openAIApiKey,
        jobTitle,
        jobDescription,
        companyName,
        companyDescription,
        resumeText,
        coverLetterText,
        additionalDocumentsText
      );
      currentExtractedTopics = topicResults.topics;
      console.log('Topics extracted:', currentExtractedTopics);
    } else if (!isFirstQuestion && existingBehavioralId) {
      // Load topic tracking data from database for subsequent questions
      console.log('Loading topic tracking data from database for subsequent question');
      const { data: behavioralData, error: loadError } = await supabase
        .from('storyline_behaviorals')
        .select('extracted_topics, asked_topics, topic_follow_up_counts')
        .eq('id', existingBehavioralId)
        .single();

      if (loadError) {
        console.error('Error loading topic tracking data:', loadError);
      } else if (behavioralData) {
        currentExtractedTopics = behavioralData.extracted_topics || [];
        currentAskedTopics = behavioralData.asked_topics || [];
        currentTopicFollowUpCounts = behavioralData.topic_follow_up_counts || {};
        console.log('Loaded topic tracking data:', {
          extractedTopics: currentExtractedTopics,
          askedTopics: currentAskedTopics,
          topicFollowUpCounts: currentTopicFollowUpCounts
        });
      }
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
      previousAnswers,
      currentExtractedTopics,
      currentAskedTopics,
      currentTopicFollowUpCounts
    );

    // Update database with topic tracking data if we have an existing behavioral ID
    if (existingBehavioralId) {
      const updateData: any = {};

      // On first question, save extracted topics
      if (isFirstQuestion && currentExtractedTopics.length > 0) {
        updateData.extracted_topics = currentExtractedTopics;
        updateData.asked_topics = [];
        updateData.topic_follow_up_counts = {};
      }

      // On subsequent questions, update topic tracking data
      if (!isFirstQuestion && parsedContent.analytics) {
        updateData.asked_topics = parsedContent.analytics.coveredTopics;
        
        // Update follow-up counts from analytics
        const followUpCounts: Record<string, number> = {};
        parsedContent.analytics.topicDepth.forEach(topicInfo => {
          followUpCounts[topicInfo.topic] = topicInfo.followUpCount;
        });
        updateData.topic_follow_up_counts = followUpCounts;
        
        // Save analytics history
        const { data: currentBehavioral } = await supabase
          .from('storyline_behaviorals')
          .select('analytics_history')
          .eq('id', existingBehavioralId)
          .single();
        
        const currentAnalyticsHistory = currentBehavioral?.analytics_history || [];
        updateData.analytics_history = [...currentAnalyticsHistory, parsedContent.analytics];
      }

      // Update the database if we have data to save
      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('storyline_behaviorals')
          .update(updateData)
          .eq('id', existingBehavioralId);

        if (updateError) {
          console.error('Error updating topic tracking data:', updateError);
        } else {
          console.log('Successfully updated topic tracking data in database');
        }
      }
    }

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
      audio: audioData,
      extractedTopics: currentExtractedTopics,
      analytics: parsedContent.analytics
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
