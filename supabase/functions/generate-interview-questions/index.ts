
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import * as pdfjs from "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.min.js";

// Set up the worker source location
pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js";

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
      
      if (resumeData) {
        try {
          // Parse PDF content using pdfjs
          const arrayBuffer = await resumeData.arrayBuffer();
          const typedArray = new Uint8Array(arrayBuffer);
          
          // Load the PDF document
          const loadingTask = pdfjs.getDocument({ data: typedArray });
          const pdfDocument = await loadingTask.promise;
          
          // Extract text from all pages
          let fullText = "";
          for (let i = 1; i <= pdfDocument.numPages; i++) {
            const page = await pdfDocument.getPage(i);
            const textContent = await page.getTextContent();
            const textItems = textContent.items.map((item: any) => item.str);
            fullText += textItems.join(' ') + '\n';
          }
          
          // Limit resume content to 3000 characters to prevent token overusage
          resumeContent = fullText.substring(0, 3000);
          console.log("Resume parsed successfully, first 100 chars:", resumeContent.substring(0, 100));
        } catch (pdfError) {
          console.error("Error parsing PDF:", pdfError);
          resumeContent = "Failed to parse resume content";
        }
      }
    } catch (error) {
      console.error("Error processing resume:", error);
      resumeContent = "Failed to process resume";
    }
    
    // Build company information section for the prompt
    let companyInfo = "";
    if (requestData.companyName) {
      companyInfo += `Company Name: ${requestData.companyName}\n`;
    }
    if (requestData.companyDescription) {
      companyInfo += `Company Description: ${requestData.companyDescription}\n`;
    }
    
    // Prepare prompt for OpenAI
    const prompt = `
      Generate interview questions for a ${requestData.jobTitle} position.
      
      Job Description: ${requestData.jobDescription}
      
      ${companyInfo}
      
      Candidate Resume: ${resumeContent}
      
      Based on the job description, company information, and candidate's resume, provide:
      1. 2 technical questions specific to the role and tailored to the candidate's background
      2. 2 behavioral questions relevant to the position
      3. 2 questions about the candidate's specific experience mentioned in their resume
      
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

    console.log("Sending request to OpenAI API with resume content included");

    // Call OpenAI API
    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo-1106",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that generates interview questions based on job descriptions, company information, and candidate resumes. Your response must be valid JSON that can be parsed directly, no additional text allowed."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error(`OpenAI API error: ${openAIResponse.status} - ${errorText}`);
      throw new Error(`OpenAI API error: ${openAIResponse.status} - ${errorText}`);
    }

    const openAIData = await openAIResponse.json();
    console.log("OpenAI response received"); // Log that we received a response
    
    const generatedContent = openAIData.choices[0].message.content;
    console.log("Raw generated content length:", generatedContent.length);
    
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
      
      console.log("Final structured response created");
      
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
