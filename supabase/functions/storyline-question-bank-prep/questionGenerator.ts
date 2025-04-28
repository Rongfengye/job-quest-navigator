
import { QuestionGenerationRequest } from "./types.ts";
import { responseSchema } from "./config.ts";

export const generateQuestions = async (
  data: QuestionGenerationRequest,
  perplexityApiKey: string
) => {
  const sonarSystemPrompt = `You are a specialized AI interview coach for college students and recent graduates. Generate interview questions for a ${data.jobTitle} position.
  ${data.companyName ? `Company: ${data.companyName}` : ''}
  ${data.companyDescription ? `Company Description: ${data.companyDescription}` : ''}
  
  Based on the provided information, generate 10 interview questions:
  - 5 technical questions focused on entry-level technical skills and problem-solving
  - 5 behavioral questions focused on teamwork, learning, and project experience
  
  Your response MUST be a valid JSON object in the following format:
  {
    "technicalQuestions": [
      {
        "question": "string",
        "explanation": "string",
        "modelAnswer": "string (STAR format)",
        "followUp": ["string"]
      }
    ],
    "behavioralQuestions": [
      {
        "question": "string",
        "explanation": "string",
        "modelAnswer": "string (STAR format)",
        "followUp": ["string"]
      }
    ]
  }`;

  const userPrompt = `
  Job Title: "${data.jobTitle}"
  Job Description: "${data.jobDescription}"
  ${data.companyName ? `Company Name: "${data.companyName}"` : ''}
  ${data.companyDescription ? `Company Description: "${data.companyDescription}"` : ''}
  
  ${data.resumeText ? `Resume content: "${data.resumeText}"` : ''}
  ${data.coverLetterText ? `Cover Letter content: "${data.coverLetterText}"` : ''}
  ${data.additionalDocumentsText ? `Additional Documents content: "${data.additionalDocumentsText}"` : ''}
  `;

  console.log('Calling Perplexity Sonar API');
  const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${perplexityApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [
        { role: 'system', content: sonarSystemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: 4000,
      top_p: 0.9,
      frequency_penalty: 1,
      presence_penalty: 0,
      response_format: {
        "type": "json_schema",
        "json_schema": responseSchema
      }
    }),
  });

  return perplexityResponse;
};
