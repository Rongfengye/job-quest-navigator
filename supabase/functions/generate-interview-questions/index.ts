import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  jobTitle: string;
  jobDescription: string;
  companyName?: string;
  companyDescription?: string;
  resumePath: string;
  coverLetterPath?: string;
  additionalDocumentsPath?: string;
}

interface Question {
  question: string;
  explanation: string;
}

interface QuestionsResponse {
  technicalQuestions: Question[];
  behavioralQuestions: Question[];
  experienceQuestions: Question[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      console.error("OpenAI API key not configured");
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { 
          status: 500, 
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json" 
          } 
        }
      );
    }

    // Parse request body
    const requestData: RequestBody = await req.json();
    console.log("Request data received:", JSON.stringify(requestData, null, 2));
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_ANON_KEY") || "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Extract file contents from storage
    let resumeContent = "";
    
    try {
      // Download resume file from storage
      const { data: resumeData, error: resumeError } = await supabaseClient
        .storage
        .from("job_documents")
        .download(requestData.resumePath);
        
      if (resumeError) {
        console.error("Error downloading resume:", resumeError.message);
        throw new Error(`Error downloading resume: ${resumeError.message}`);
      }
      
      // For PDF files we would normally use a PDF parsing library,
      // but for this demo we'll just use placeholder text
      resumeContent = "Resume content would be extracted here";
      console.log("Resume downloaded successfully");
    } catch (error) {
      console.error("Error processing resume:", error);
      resumeContent = "Failed to process resume";
    }
    
    // Prepare prompt for OpenAI
    const prompt = `
      Generate interview questions for a ${requestData.jobTitle} position.
      
      Job Description: ${requestData.jobDescription}
      
      ${requestData.companyName ? `Company: ${requestData.companyName}` : ''}
      ${requestData.companyDescription ? `Company Description: ${requestData.companyDescription}` : ''}
      
      Based on the job description, provide:
      1. 2 technical questions specific to the role
      2. 2 behavioral questions
      3. 2 questions about the candidate's experience
      
      You must return only valid JSON output. Ensure that:
      - The JSON follows strict syntax with properly closed brackets and commas.
      - There are no trailing commas.
      - The JSON format strictly matches this:
      {
        "technicalQuestions": [{ "question": "Qt1", "explanation": "Et1" }, { "question": "Qt2", "explanation": "Et2" }],
        "behavioralQuestions": [{ "question": "Qb1", "explanation": "Eb1" }, { "question": "Qb2", "explanation": "Eb2" }],
        "experienceQuestions": [{ "question": "Qe1", "explanation": "Ee1" }, { "question": "Qe2", "explanation": "Ee2" }]
      }
      Do not include any other text, explanations, or comments.
    `;

    console.log("Sending request to OpenAI API...");

    // Call OpenAI API
    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that generates interview questions based on job descriptions and resumes. Your response must be valid JSON that can be parsed directly, no additional text allowed."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: "json",  // ✅ Enforce JSON response format
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error(`OpenAI API error: ${openAIResponse.status} - ${errorText}`);
      throw new Error(`OpenAI API error: ${openAIResponse.status} - ${errorText}`);
    }

    const openAIData = await openAIResponse.json();
    console.log("OpenAI response received:", JSON.stringify(openAIData, null, 2)); // Log full response
    
    const generatedContent = openAIData.choices[0].message.content;
    console.log("Raw generated content:", generatedContent);
    
    // Parse the generated content as JSON
    let parsedQuestions: QuestionsResponse;
    try {
      parsedQuestions = JSON.parse(generatedContent);
      console.log("Successfully parsed JSON response");
      
      // Validate the structure of the parsed questions
      if (!parsedQuestions.technicalQuestions || !Array.isArray(parsedQuestions.technicalQuestions) || 
          !parsedQuestions.behavioralQuestions || !Array.isArray(parsedQuestions.behavioralQuestions) || 
          !parsedQuestions.experienceQuestions || !Array.isArray(parsedQuestions.experienceQuestions)) {
        console.error("Response structure is invalid");
        throw new Error("Invalid response structure from OpenAI");
      }
      
      // Ensure each question has the required properties
      const validateQuestions = (questions: any[]): Question[] => {
        return questions.map(q => ({
          question: q.question || "Question not provided",
          explanation: q.explanation || "Explanation not provided"
        }));
      };
      
      // Create a properly structured response
      const structuredResponse: QuestionsResponse = {
        technicalQuestions: validateQuestions(parsedQuestions.technicalQuestions),
        behavioralQuestions: validateQuestions(parsedQuestions.behavioralQuestions),
        experienceQuestions: validateQuestions(parsedQuestions.experienceQuestions)
      };
      
      console.log("Final structured response:", JSON.stringify(structuredResponse, null, 2));
      
      return new Response(
        JSON.stringify(structuredResponse),
        { 
          status: 200, 
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json" 
          } 
        }
      );
    } catch (error) {
      console.error("Failed to parse OpenAI response as JSON:", error);
      console.error("Generated content that failed to parse:", generatedContent);
      
      return new Response(
        JSON.stringify({ error: "Invalid JSON format from OpenAI" }),
        { 
          status: 500, 
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json" 
          } 
        }
      );
    }
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});
