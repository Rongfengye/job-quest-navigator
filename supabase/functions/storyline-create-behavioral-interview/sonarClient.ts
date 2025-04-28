
import { corsHeaders, sonarConfig } from './config.ts';
import { SonarResponseSchema } from './types.ts';

export async function callSonarAPI(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  isFeedback: boolean = false
) {
  try {
    const schema = isFeedback ? feedbackResponseSchema : questionResponseSchema;
    
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
          json_schema: schema
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

const questionResponseSchema: SonarResponseSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  additionalProperties: false,
  properties: {
    question: {
      type: "string",
      description: "The behavioral interview question"
    }
  },
  required: ["question"]
};

const feedbackResponseSchema: SonarResponseSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  additionalProperties: false,
  properties: {
    feedback: {
      type: "object",
      description: "Comprehensive feedback for the interview responses",
      additionalProperties: false,
      properties: {
        overallAssessment: { type: "string" },
        strengthsAndWeaknesses: {
          type: "object",
          properties: {
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } }
          }
        },
        individualResponses: {
          type: "array",
          items: {
            type: "object",
            properties: {
              questionIndex: { type: "number" },
              strengths: { type: "array", items: { type: "string" } },
              improvements: { type: "array", items: { type: "string" } },
              score: { type: "number" }
            }
          }
        },
        improvementPlan: { type: "string" },
        overallScore: { type: "number" }
      },
      required: ["overallAssessment", "strengthsAndWeaknesses", "individualResponses", "improvementPlan", "overallScore"]
    }
  },
  required: ["feedback"]
};
