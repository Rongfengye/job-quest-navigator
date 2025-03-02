
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

interface RequestBody {
  jobTitle: string;
  jobDescription: string;
  companyName?: string;
  companyDescription?: string;
  resumePath: string;
  coverLetterPath?: string;
  additionalDocumentsPath?: string;
}

serve(async (req) => {
  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const requestData: RequestBody = await req.json();
    
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
        
      if (resumeError) throw new Error(`Error downloading resume: ${resumeError.message}`);
      
      // For PDF files we would normally use a PDF parsing library,
      // but for this demo we'll just use placeholder text
      resumeContent = "Resume content would be extracted here";
    } catch (error) {
      console.error("Error processing resume:", error);
      resumeContent = "Failed to process resume";
    }
    
    // Prepare prompt for OpenAI
    const prompt = `
      Generate 10 likely interview questions for a ${requestData.jobTitle} position.
      
      Job Description: ${requestData.jobDescription}
      
      ${requestData.companyName ? `Company: ${requestData.companyName}` : ''}
      ${requestData.companyDescription ? `Company Description: ${requestData.companyDescription}` : ''}
      
      Based on the resume content and job description, provide:
      1. 5 technical questions specific to the role
      2. 3 behavioral questions
      3. 2 questions about the candidate's experience
      
      Format the response as a JSON object with the following structure:
      {
        "technicalQuestions": [
          { "question": "Question text", "explanation": "Why this is relevant" }
        ],
        "behavioralQuestions": [
          { "question": "Question text", "explanation": "Why this is relevant" }
        ],
        "experienceQuestions": [
          { "question": "Question text", "explanation": "Why this is relevant" }
        ]
      }
    `;

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
            content: "You are a helpful assistant that generates interview questions based on job descriptions and resumes."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      throw new Error(`OpenAI API error: ${openAIResponse.status} - ${errorText}`);
    }

    const openAIData = await openAIResponse.json();
    const generatedContent = openAIData.choices[0].message.content;
    
    // Parse the generated content as JSON
    let parsedQuestions;
    try {
      parsedQuestions = JSON.parse(generatedContent);
    } catch (error) {
      // If JSON parsing fails, create a structured format anyway
      console.error("Failed to parse OpenAI response as JSON:", error);
      parsedQuestions = {
        technicalQuestions: [{ 
          question: "The API response was not in the expected format.", 
          explanation: "Please try again." 
        }],
        behavioralQuestions: [],
        experienceQuestions: []
      };
    }

    return new Response(
      JSON.stringify(parsedQuestions),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
