
import { corsHeaders, sonarConfig } from './config.ts';
import { SonarResponseSchema } from './types.ts';

/**
 * Calls the Perplexity Sonar API to generate either interview questions or feedback
 * @param systemPrompt - The system instructions for the AI
 * @param userPrompt - The user's input/context for generation
 * @param apiKey - The Perplexity API key
 * @param isFeedback - Whether this call is for generating feedback (true) or questions (false)
 * @returns Promise containing the API response
 */
export async function callSonarAPI(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  isFeedback: boolean = false
) {
  try {
    // Select the appropriate schema based on whether we're generating feedback or questions
    const schema = isFeedback ? feedbackResponseSchema : questionResponseSchema;
    
    // Make the API call to Perplexity
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...sonarConfig,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: { schema }
        }
      }),
    });

    // Handle API errors
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Perplexity API error: ${error}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling Sonar API:', error);
    throw error;
  }
}

// Schema for question generation responses
const questionResponseSchema: SonarResponseSchema = {
  type: "object",
  properties: {
    question: {
      type: "string",
      description: "The behavioral interview question"
    }
  },
  required: ["question"]
};

// Schema for feedback generation responses
const feedbackResponseSchema: SonarResponseSchema = {
  type: "object",
  properties: {
    feedback: {
      type: "object",
      description: "Comprehensive feedback for the interview responses"
    }
  },
  required: ["feedback"]
};
