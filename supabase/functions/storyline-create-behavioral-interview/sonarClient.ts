
import { SonarResponseSchema } from './types.ts';

export const callSonarAPI = async (systemPrompt: string, userPrompt: string, apiKey: string) => {
  console.log('[DEBUG] Preparing Sonar API call');
  console.log('[DEBUG] System prompt length:', systemPrompt.length);
  console.log('[DEBUG] User prompt length:', userPrompt.length);
  
  const schema: SonarResponseSchema = {
    type: "object",
    properties: {
      question: {
        type: "string",
        description: "The behavioral interview question"
      }
    },
    required: ["question"]
  };

  try {
    console.log('[DEBUG] Making request to Perplexity API');
    
    const requestBody = {
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: 1000,
      response_format: {
        type: "json_schema",
        json_schema: schema
      }
    };
    
    console.log('[DEBUG] Perplexity request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[ERROR] Perplexity API returned an error:', JSON.stringify(data, null, 2));
      throw new Error(`Perplexity API error: ${JSON.stringify(data.error)}`);
    }

    console.log('[DEBUG] Perplexity API call successful');
    return data;
  } catch (error) {
    console.error('[ERROR] Error calling Sonar API:', error);
    throw error;
  }
};
