
import { corsHeaders, sonarConfig } from './config.ts';
import { SonarResponseSchema } from './types.ts';

export async function callSonarAPI(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string
) {
  try {
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
          json_schema: { schema: responseSchema }
        }
      }),
    });

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
