
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { PdfReader } from "https://esm.sh/pdfreader@3.0.0";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
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
      
      console.log("Resume downloaded successfully");
      
      // Check if it's a PDF file
      if (requestData.resumePath.toLowerCase().endsWith('.pdf')) {
        // Convert the ArrayBuffer to Uint8Array for PDF parsing
        const pdfBuffer = new Uint8Array(await resumeData.arrayBuffer());
        
        // Parse PDF content
        let extractedText = "";
        const pdfReader = new PdfReader();
        
        // This is a simplified approach - in production, you might need a more robust solution
        try {
          // Convert the parsing to a promise-based approach
          const parsedItems = await new Promise((resolve, reject) => {
            const items: any[] = [];
            pdfReader.parseBuffer(pdfBuffer, (err: any, item: any) => {
              if (err) reject(err);
              if (!item) resolve(items);
              if (item.text) items.push(item.text);
            });
          });
          
          // Join all text items
          if (Array.isArray(parsedItems)) {
            extractedText = parsedItems.join(" ");
          }
        } catch (pdfError) {
          console.error("Error parsing PDF:", pdfError);
          extractedText = "Failed to parse PDF content";
        }
        
        resumeContent = extractedText;
      } else {
        // For non-PDF files, assume text content
        resumeContent = await resumeData.text();
      }
      
      // Limit resume content to 3000 characters to prevent token overflow
      if (resumeContent.length > 3000) {
        console.log(`Limiting resume content from ${resumeContent.length} to 3000 characters`);
        resumeContent = resumeContent.substring(0, 3000) + "... (content truncated)";
      }
      
      console.log("Resume content extracted, length:", resumeContent.length);
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
      
      Resume Content:
      ${resumeContent}
      
      Based on the job description and the candidate's resume, provide:
      1. 2 technical questions specific to the role and candidate's skills
      2. 2 behavioral questions relevant to the position and candidate's past experiences
      3. 2 questions about the candidate's experience that highlight their fit for this role
      
      You must return only valid JSON output. Ensure that:
      - The JSON follows strict syntax with properly closed brackets and commas.
      - There are no trailing commas.
      - The JSON format strictly matches this:
      {
        "technicalQuestions": [{ "question": "Qt1", "explanation": "Et1" }, { "question": "Qt2", "explanation": "Et2" }],
        "behavioralQuestions": [{ "question": "Qb1", "explanation": "Eb1" }, { "question": "Qb2", "explanation": "Eb2" }],
        "experienceQuestions": [{ "question": "Qe1", "explanation": "Ee1" }, { "question": "Qe2", "explanation": "Ee2" }]
      }
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
        model: "gpt-3.5-turbo-1106",  // Using the specified model
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
        response_format: { type: "json_object" }  // Using the specified response format
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
