
import { corsHeaders, sonarConfig } from './config.ts';
import { SonarResponseSchema } from './types.ts';

export async function callSonarAPI(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string
) {
  try {
    console.log('[DEBUG] Preparing Sonar API call');
    console.log('[DEBUG] System prompt length:', systemPrompt.length);
    console.log('[DEBUG] User prompt length:', userPrompt.length);
    
    const requestBody = {
      ...sonarConfig,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: { schema: responseSchema }
      }
    };
    
    console.log('[DEBUG] Making request to Perplexity API');
    console.log('[DEBUG] Perplexity request body:', JSON.stringify(requestBody));

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ERROR] Perplexity API returned an error:', errorText);
      throw new Error(`Perplexity API error: ${errorText}`);
    }

    const responseData = await response.json();
    console.log('[DEBUG] Perplexity API response received');
    return responseData;
  } catch (error) {
    console.error('Error calling Sonar API:', error);
    throw error;
  }
}

const responseSchema: SonarResponseSchema = {
  type: "object",
  properties: {
    question: {
      type: "string",
      description: "The behavioral interview question"
    }
  },
  required: ["question"]
};
