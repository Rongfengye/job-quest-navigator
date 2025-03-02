
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  
  try {
    // Get data from request
    const { 
      jobTitle,
      jobDescription,
      companyName,
      companyDescription,
      resumeText,
      coverLetterText,
      additionalDocumentsText
    } = await req.json();
    
    console.log("Received job details:", { jobTitle, companyName });
    console.log("Resume text length:", resumeText?.length || 0);
    
    // Construct the prompt for OpenAI
    let systemPrompt = `You are an expert interviewer for the role of ${jobTitle || "the job position"}`;
    
    if (companyName) {
      systemPrompt += ` at ${companyName}`;
    }
    
    systemPrompt += `. Your task is to generate a comprehensive set of interview questions based on the job description`;
    
    if (resumeText) {
      systemPrompt += ` and the candidate's resume`;
    }
    
    if (coverLetterText) {
      systemPrompt += `, cover letter`;
    }
    
    systemPrompt += `.

For each question:
1. Provide a challenging, relevant question that would be asked in a real interview.
2. Supply a model answer or key points that should be included in a good answer.
3. Include follow-up questions to go deeper on the topic.

Structure the response as JSON with this format:
{
  "questions": [
    {
      "question": "Main question text",
      "modelAnswer": "Detailed model answer",
      "followUp": ["Follow-up question 1", "Follow-up question 2"]
    }
  ]
}

Generate at least 5 questions covering different aspects of the role including technical skills, experience, behavioral questions, and situation-based scenarios.
If the resume is provided, tailor some questions to the candidate's background.`;

    let userPrompt = `Job Title: ${jobTitle || "Not provided"}\n\nJob Description: ${jobDescription || "Not provided"}\n\n`;
    
    if (companyName) {
      userPrompt += `Company Name: ${companyName}\n\n`;
    }
    
    if (companyDescription) {
      userPrompt += `Company Description: ${companyDescription}\n\n`;
    }
    
    if (resumeText) {
      userPrompt += `Candidate Resume:\n${resumeText}\n\n`;
    }
    
    if (coverLetterText) {
      userPrompt += `Cover Letter:\n${coverLetterText}\n\n`;
    }
    
    if (additionalDocumentsText) {
      userPrompt += `Additional Documents:\n${additionalDocumentsText}\n\n`;
    }
    
    userPrompt += "Please generate appropriate interview questions with model answers and follow-up questions for this position.";
    
    console.log("Sending request to OpenAI...");
    
    // Call OpenAI API
    const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.7,
      }),
    });
    
    const openAiData = await openAiResponse.json();
    
    // Log the response from OpenAI (only partial for privacy and brevity)
    console.log("Received response from OpenAI:", {
      status: openAiResponse.status,
      statusText: openAiResponse.statusText,
      responseStart: openAiData.choices ? openAiData.choices[0]?.message?.content?.substring(0, 100) + "..." : "No choices in response",
    });
    
    // Check if we got an error response from OpenAI
    if (!openAiResponse.ok) {
      console.error("OpenAI API error:", openAiData);
      throw new Error(`OpenAI API error: ${openAiData.error?.message || "Unknown error"}`);
    }
    
    // Return response
    return new Response(
      JSON.stringify(openAiData.choices[0].message.content),
      { 
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Error:", error.message);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
