import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./config.ts";
import { RequestData } from "./types.ts";
import { generateQuestions } from "./questionGenerator.ts";
import { generateAnswerFeedback } from "./answerFeedback.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get API keys from environment variables
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
  
  try {
    const requestData = await req.json() as RequestData;
    console.log('[DEBUG - question-bank-prep] Request type:', requestData.requestType);
    console.log('[DEBUG - question-bank-prep] Request data:', JSON.stringify(requestData, null, 2));

    if (requestData.requestType === 'GENERATE_QUESTION') {
      console.log('[DEBUG - question-bank-prep] Received request to generate interview questions');
      console.log('[DEBUG - question-bank-prep] Resume text length:', requestData.resumeText?.length || 0);

      console.log('[DEBUG - question-bank-prep] Calling Perplexity API for question generation...');
      const perplexityResponse = await generateQuestions(requestData, perplexityApiKey!);
      const perplexityData = await perplexityResponse.json();
      console.log('[DEBUG - question-bank-prep] Perplexity API response received');

      if (perplexityData.error) {
        console.error('[DEBUG - question-bank-prep] Perplexity API error:', perplexityData.error);
        throw new Error(`Perplexity API error: ${perplexityData.error.message}`);
      }

      const generatedContent = perplexityData.choices[0].message.content;
      console.log('[DEBUG - question-bank-prep] Generated content length:', generatedContent.length);
      console.log('[DEBUG - question-bank-prep] Content preview:', generatedContent.substring(0, 100));

      let parsedContent;
      try {
        if (typeof generatedContent === 'object' && generatedContent !== null) {
          parsedContent = generatedContent;
          console.log('[DEBUG - question-bank-prep] Content was already a JSON object');
        } else if (typeof generatedContent === 'string') {
          let cleanContent = generatedContent;
          if (cleanContent.includes('```json')) {
            cleanContent = cleanContent.replace(/```json/g, '').replace(/```/g, '').trim();
            console.log('[DEBUG - question-bank-prep] Removed markdown code blocks');
          }
          
          parsedContent = JSON.parse(cleanContent);
          console.log('[DEBUG - question-bank-prep] Successfully parsed JSON string');
        } else {
          console.error('[DEBUG - question-bank-prep] Unexpected content type:', typeof generatedContent);
          throw new Error('Content is neither a string nor an object');
        }
        
        console.log('[DEBUG - question-bank-prep] Parsed content structure check:', 
          'technicalQuestions' in parsedContent ? 'has technicalQuestions' : 'no technicalQuestions',
          'behavioralQuestions' in parsedContent ? 'has behavioralQuestions' : 'no behavioralQuestions',
          'questions' in parsedContent ? 'has questions' : 'no questions'
        );
        
        if (!parsedContent.technicalQuestions && !parsedContent.behavioralQuestions && !parsedContent.questions) {
          console.error('[DEBUG - question-bank-prep] Invalid response structure:', JSON.stringify(parsedContent).substring(0, 200));
          throw new Error('Perplexity did not return the expected data structure');
        }
        
        if ((!parsedContent.technicalQuestions || !parsedContent.behavioralQuestions) && parsedContent.questions) {
          console.log('[DEBUG - question-bank-prep] Transforming questions array to separate technical and behavioral arrays');
          
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
          console.log('[DEBUG - question-bank-prep] Transformed to expected structure');
        }
        
        console.log('[DEBUG - question-bank-prep] Final structure:', 
          'technicalQuestions count:', parsedContent.technicalQuestions?.length || 0,
          'behavioralQuestions count:', parsedContent.behavioralQuestions?.length || 0
        );
        
      } catch (parseError) {
        console.error('[DEBUG - question-bank-prep] Error parsing JSON response:', parseError);
        console.log('[DEBUG - question-bank-prep] Raw response:', generatedContent);
        throw new Error('Invalid JSON format in the Perplexity response');
      }

      return new Response(JSON.stringify(parsedContent), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } else if (requestData.requestType === 'GENERATE_ANSWER') {
      console.log('[DEBUG - question-bank-prep] Received request to generate feedback for answer');
      console.log('[DEBUG - question-bank-prep] Question type:', requestData.questionType);
      console.log('[DEBUG - question-bank-prep] Answer length:', requestData.answerText?.length || 0);

      console.log('[DEBUG - question-bank-prep] Calling OpenAI for answer feedback...');
      const openAIResponse = await generateAnswerFeedback(requestData, openAIApiKey!);
      const openAIData = await openAIResponse.json();
      console.log('[DEBUG - question-bank-prep] OpenAI API response received');
      
      if (openAIData.error) {
        console.error('[DEBUG - question-bank-prep] OpenAI API error:', openAIData.error);
        throw new Error(`OpenAI API error: ${openAIData.error.message}`);
      }

      const generatedContent = openAIData.choices[0].message.content;
      console.log('[DEBUG - question-bank-prep] Generated feedback received, parsing JSON');
      
      let feedbackContent;
      try {
        feedbackContent = JSON.parse(generatedContent);
        
        if (!feedbackContent.pros || !feedbackContent.cons) {
          console.error('[DEBUG - question-bank-prep] Invalid feedback structure:', feedbackContent);
          throw new Error('OpenAI did not return the expected data structure');
        }
        
        console.log('[DEBUG - question-bank-prep] Feedback successfully parsed');
      } catch (parseError) {
        console.error('[DEBUG - question-bank-prep] Error parsing feedback JSON:', parseError);
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
    console.error('[DEBUG - question-bank-prep] Error processing request:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
