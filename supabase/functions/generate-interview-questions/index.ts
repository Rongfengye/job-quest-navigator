
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.1.0'
import 'https://deno.land/x/xhr@0.3.0/mod.ts'
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.2.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    })
  }

  try {
    // Extract request body
    const requestData = await req.json()
    
    // Get OpenAI API key from environment variables
    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }
    
    // Configure OpenAI
    const configuration = new Configuration({ apiKey: openAiKey })
    const openai = new OpenAIApi(configuration)
    
    console.log("Processing request for job:", requestData.jobTitle)
    
    // Prepare prompt for OpenAI
    const prompt = `I need to prepare for an interview for the following job:
    
Job Title: ${requestData.jobTitle}
Company: ${requestData.companyName || "Not specified"}
Company Description: ${requestData.companyDescription || "Not provided"}

Job Description:
${requestData.jobDescription}

My Resume:
${requestData.resumeText || "Not provided"}

${requestData.coverLetterText ? `My Cover Letter:\n${requestData.coverLetterText}` : ""}
${requestData.additionalDocumentsText ? `Additional Information:\n${requestData.additionalDocumentsText}` : ""}

Based on this information, please generate a set of 12-15 likely interview questions that I might be asked during the interview. Aim for a mix of technical, behavioral, and experience-based questions.

For each question, please include:
1. The interview question itself
2. A brief explanation of why the interviewer might ask this question
3. Suggested answer points or a model answer
4. 1-2 potential follow-up questions I should be ready for

Format your response as a JSON object with the following structure:
{
  "questions": [
    {
      "question": "The interview question",
      "explanation": "Why they might ask this",
      "modelAnswer": "Suggested answer approach",
      "followUp": ["Potential follow-up question 1", "Potential follow-up question 2"]
    }
  ]
}

Make the JSON valid and properly escaped.`

    // Call OpenAI API
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an interview preparation expert who helps job seekers prepare for interviews by generating likely interview questions and model answers based on job descriptions and resumes." },
        { role: "user", content: prompt }
      ],
      max_tokens: 3500,
      temperature: 0.7,
    })
    
    const openaiResponse = response.data.choices[0].message?.content
    
    console.log("Generated response, length:", openaiResponse?.length || 0)
    console.log("Response sample:", openaiResponse?.substring(0, 200) + "...")
    
    // Parse response as JSON
    let parsedResponse
    try {
      parsedResponse = JSON.parse(openaiResponse || "{}")
    } catch (error) {
      console.error("Error parsing OpenAI response as JSON:", error)
      console.log("Raw response:", openaiResponse)
      
      // Return error response
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse OpenAI response", 
          rawResponse: openaiResponse 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }
    
    // Check if we have valid questions in the response
    if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions) || parsedResponse.questions.length === 0) {
      console.error("Invalid response format - no questions array found")
      
      // Return error response
      return new Response(
        JSON.stringify({ 
          error: "Invalid response format from OpenAI", 
          parsedResponse 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // Return successfully processed questions
    return new Response(
      JSON.stringify(parsedResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
    
  } catch (error) {
    console.error("Error in generate-interview-questions function:", error)
    
    // Return generic error response
    return new Response(
      JSON.stringify({ error: error.message || "An unknown error occurred" }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
