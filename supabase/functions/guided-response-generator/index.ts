
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const requestBody = await req.text();
    console.log('Request body received:', requestBody);
    
    let requestData;
    try {
      requestData = JSON.parse(requestBody);
      console.log('Request data parsed successfully:', JSON.stringify(requestData));
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      throw new Error(`Invalid request format: ${parseError.message}`);
    }
    
    const { questionIndex, questionType, questionText, userInput = "" } = requestData;
    
    console.log(`Generating guided response for question #${questionIndex} (${questionType}): ${questionText}`);
    console.log(`User's current input: ${userInput || "No input provided"}`);
    
    // Get the OpenAI API key from environment variables
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    // Prepare the prompt for OpenAI
    const messages = [
      {
        role: "system",
        content: "You're an interview coach that helps candidates come up with their responses. It is important to note that you ask 5 followup questions to guide them to formulate their response, rather than giving them the perfect finished response. You'll be given their resume, and their current progress on the question can be anywhere from blank, some basic sentences, or MVP equivalent."
      },
      {
        role: "user",
        content: `Interview Question (${questionType}): ${questionText}\n\nUser's current response: ${userInput || "No response yet"}\n\nPlease provide 5 guiding questions to help me formulate a strong answer.`
      }
    ];
    
    // Prepare API request
    const openAIRequestPayload = {
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    };
    
    // Log the entire OpenAI request payload for debugging
    console.log('OpenAI API request payload:', JSON.stringify(openAIRequestPayload));
    
    // Call OpenAI API
    console.log('Sending request to OpenAI API...');
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`
      },
      body: JSON.stringify(openAIRequestPayload)
    });
    
    console.log('OpenAI API response status:', openAIResponse.status);
    console.log('OpenAI API response headers:', JSON.stringify(Object.fromEntries(openAIResponse.headers.entries())));
    
    if (!openAIResponse.ok) {
      console.error('OpenAI API error response status:', openAIResponse.status);
      
      try {
        // Try to get error details as JSON
        const errorData = await openAIResponse.json();
        console.error('OpenAI API error details:', JSON.stringify(errorData));
        throw new Error(`OpenAI API error: ${errorData.error?.message || JSON.stringify(errorData)}`);
      } catch (jsonError) {
        // If JSON parsing fails, try to get error as text
        console.error('Failed to parse error response as JSON, trying text...');
        const errorText = await openAIResponse.text().catch(() => 'Could not read response as text');
        console.error('OpenAI API error text:', errorText);
        throw new Error(`OpenAI API error (${openAIResponse.status}): ${errorText.substring(0, 200)}`);
      }
    }
    
    // Read the response body as text first for logging
    const responseText = await openAIResponse.clone().text();
    console.log('OpenAI API raw response text:', responseText);
    
    // Then properly parse the JSON
    let openAIData;
    try {
      openAIData = await openAIResponse.json();
      console.log('OpenAI API parsed response:', JSON.stringify(openAIData));
    } catch (parseError) {
      console.error('Error parsing OpenAI response as JSON:', parseError);
      console.log('Response text that failed to parse:', responseText);
      throw new Error(`Failed to parse OpenAI response: ${parseError.message}`);
    }
    
    // Validate response structure
    if (!openAIData.choices || !openAIData.choices[0] || !openAIData.choices[0].message) {
      console.error('Unexpected OpenAI response structure:', JSON.stringify(openAIData));
      throw new Error('OpenAI response missing expected data structure');
    }
    
    // Extract the response content
    const responseContent = openAIData.choices[0].message.content;
    console.log('Response content extracted:', responseContent);
    
    let parsedResponse;
    try {
      // Parse the JSON response
      parsedResponse = JSON.parse(responseContent);
      console.log('Successfully parsed content as JSON:', JSON.stringify(parsedResponse));
      
      // Validate expected structure
      if (!parsedResponse.guidingQuestions || !Array.isArray(parsedResponse.guidingQuestions)) {
        console.warn('Parsed response missing expected guidingQuestions array:', JSON.stringify(parsedResponse));
        throw new Error('Invalid response format: missing guidingQuestions array');
      }
    } catch (error) {
      console.error('Error parsing OpenAI response content as JSON:', error);
      console.log('Response content that failed to parse:', responseContent);
      
      // Attempt to extract questions from text format as fallback
      try {
        const textLines = responseContent.split(/\n/);
        const possibleQuestions = textLines
          .filter(line => /\d+[\.\)]/.test(line) || /\?/.test(line))
          .map(line => line.replace(/^\d+[\.\)]/, '').trim())
          .filter(line => line.length > 10 && line.endsWith('?'));
        
        if (possibleQuestions.length >= 3) {
          console.log('Extracted questions from text as fallback:', JSON.stringify(possibleQuestions));
          parsedResponse = {
            guidingQuestions: possibleQuestions.slice(0, 5)
          };
        } else {
          // If we couldn't extract questions, use a default fallback
          console.log('Using default fallback questions');
          parsedResponse = {
            guidingQuestions: [
              "What specific experience can you highlight that's relevant to this question?",
              "How can you structure your answer using the STAR method?",
              "What key skills or qualities should you emphasize in your response?",
              "How can you quantify your achievements in this context?",
              "What makes your approach or perspective unique in this situation?"
            ]
          };
        }
      } catch (extractError) {
        console.error('Failed to extract questions as fallback:', extractError);
        // Use default fallback
        parsedResponse = {
          guidingQuestions: [
            "What specific experience can you highlight that's relevant to this question?",
            "How can you structure your answer using the STAR method?",
            "What key skills or qualities should you emphasize in your response?",
            "How can you quantify your achievements in this context?",
            "What makes your approach or perspective unique in this situation?"
          ]
        };
      }
    }
    
    // Return a structured response with guidance
    const response = {
      success: true,
      answer: "",  // No answer generated, just questions
      guidance: {
        guidingQuestions: parsedResponse.guidingQuestions || [],
        questionType: questionType,
        structure: getStructureByQuestionType(questionType)
      }
    };

    console.log('Returning final response:', JSON.stringify(response));

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error("Error generating guided response:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message, 
        success: false 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

// Helper function to provide structure guidance based on question type
function getStructureByQuestionType(questionType: string) {
  switch (questionType?.toLowerCase()) {
    case 'behavioral':
      return "Consider using the STAR method: Situation, Task, Action, Result.";
    case 'technical':
      return "Structure your answer by: 1) Explaining your understanding of the concept, 2) Discussing relevant experience, 3) Providing a concrete example.";
    case 'experience':
      return "Focus on: 1) Relevant skills, 2) Specific accomplishments, 3) Lessons learned, 4) How it applies to this role.";
    default:
      return "Consider organizing your answer with a clear introduction, detailed examples, and a strong conclusion.";
  }
}
