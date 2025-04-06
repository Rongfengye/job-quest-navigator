
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
    const { questionIndex, questionType, questionText, userInput = "" } = await req.json();
    
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
    
    // Log the entire OpenAI request payload for debugging
    console.log('OpenAI API request payload:', JSON.stringify({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    }));
    
    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      })
    });
    
    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error response:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        console.error('OpenAI API error (parsed):', errorData);
        throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
      } catch (parseError) {
        console.error('Failed to parse OpenAI error response:', parseError);
        throw new Error(`OpenAI API error (status ${openAIResponse.status}): ${errorText}`);
      }
    }
    
    const responseText = await openAIResponse.text();
    console.log('OpenAI raw response text:', responseText);
    
    let openAIData;
    try {
      openAIData = JSON.parse(responseText);
      console.log('OpenAI parsed response:', JSON.stringify(openAIData));
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError, 'Raw response:', responseText);
      throw new Error(`Failed to parse OpenAI response: ${parseError.message}`);
    }
    
    // Extract the response content
    const responseContent = openAIData.choices[0].message.content;
    let parsedResponse;
    
    try {
      // Parse the JSON response
      parsedResponse = JSON.parse(responseContent);
      console.log('Successfully parsed content as JSON:', JSON.stringify(parsedResponse));
    } catch (error) {
      console.error('Error parsing OpenAI response content as JSON:', error);
      console.log('Response content that failed to parse:', responseContent);
      // Fallback in case parsing fails
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
    
    // Return a structured response with guidance
    const response = {
      success: true,
      answer: "",  // No answer generated, just questions
      guidance: {
        guidingQuestions: parsedResponse.guidingQuestions || responseContent,
        questionType: questionType,
        structure: getStructureByQuestionType(questionType)
      }
    };

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
