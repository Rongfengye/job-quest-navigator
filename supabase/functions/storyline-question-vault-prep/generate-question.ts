
import { corsHeaders } from './index.ts';

export async function generateQuestion(requestData: any, perplexityApiKey: string) {
  const { 
    jobTitle, 
    jobDescription, 
    companyName, 
    companyDescription, 
    resumeText, 
    coverLetterText, 
    additionalDocumentsText
  } = requestData;

  console.log('Received request to generate interview questions');
  console.log('Resume text length:', resumeText?.length || 0);

  // Sonar system prompt
  const sonarSystemPrompt = `You are a specialized AI interview coach for college students and recent graduates. Generate interview questions for a ${jobTitle} position.
  ${companyName ? `Company: ${companyName}` : ''}
  ${companyDescription ? `Company Description: ${companyDescription}` : ''}
  
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

  // Create the user prompt with all the relevant information
  const userPrompt = `
  Job Title: "${jobTitle}"
  Job Description: "${jobDescription}"
  ${companyName ? `Company Name: "${companyName}"` : ''}
  ${companyDescription ? `Company Description: "${companyDescription}"` : ''}
  
  ${resumeText ? `Resume content: "${resumeText}"` : ''}
  ${coverLetterText ? `Cover Letter content: "${coverLetterText}"` : ''}
  ${additionalDocumentsText ? `Additional Documents content: "${additionalDocumentsText}"` : ''}
  `;

  // Define the JSON schema for response format
  const responseSchema = {
    "type": "object",
    "properties": {
      "technicalQuestions": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "question": { "type": "string" },
            "explanation": { "type": "string" },
            "modelAnswer": { "type": "string" },
            "followUp": { 
              "type": "array",
              "items": { "type": "string" }
            }
          },
          "required": ["question", "explanation", "modelAnswer", "followUp"]
        }
      },
      "behavioralQuestions": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "question": { "type": "string" },
            "explanation": { "type": "string" },
            "modelAnswer": { "type": "string" },
            "followUp": { 
              "type": "array",
              "items": { "type": "string" }
            }
          },
          "required": ["question", "explanation", "modelAnswer", "followUp"]
        }
      }
    },
    "required": ["technicalQuestions", "behavioralQuestions"]
  };

  // New Perplexity Sonar API call with proper response_format
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
        "json_schema": { "schema": responseSchema }
      }
    }),
  });

  const perplexityData = await perplexityResponse.json();
  console.log('Perplexity API response received');

  if (perplexityData.error) {
    console.error('Perplexity API error:', perplexityData.error);
    throw new Error(`Perplexity API error: ${perplexityData.error.message}`);
  }

  const generatedContent = perplexityData.choices[0].message.content;
  console.log('Generated content length:', generatedContent.length);
  
  // Log first 100 characters to check format
  console.log('Content preview:', generatedContent.substring(0, 100));

  let parsedContent;
  try {
    // Check if content is already a JSON object
    if (typeof generatedContent === 'object' && generatedContent !== null) {
      parsedContent = generatedContent;
      console.log('Content was already a JSON object');
    } 
    // Try to parse as JSON string
    else if (typeof generatedContent === 'string') {
      // Remove markdown code blocks if present
      let cleanContent = generatedContent;
      if (cleanContent.includes('```json')) {
        cleanContent = cleanContent.replace(/```json/g, '').replace(/```/g, '').trim();
        console.log('Removed markdown code blocks');
      }
      
      parsedContent = JSON.parse(cleanContent);
      console.log('Successfully parsed JSON string');
    } else {
      console.error('Unexpected content type:', typeof generatedContent);
      throw new Error('Content is neither a string nor an object');
    }
    
    // Validate the expected structure
    console.log('Parsed content structure check:', 
      'technicalQuestions' in parsedContent ? 'has technicalQuestions' : 'no technicalQuestions',
      'behavioralQuestions' in parsedContent ? 'has behavioralQuestions' : 'no behavioralQuestions',
      'questions' in parsedContent ? 'has questions' : 'no questions'
    );
    
    if (!parsedContent.technicalQuestions && !parsedContent.behavioralQuestions && !parsedContent.questions) {
      console.error('Invalid response structure:', JSON.stringify(parsedContent).substring(0, 200));
      throw new Error('Perplexity did not return the expected data structure');
    }
    
    // Transform if the response doesn't match our expected structure
    if ((!parsedContent.technicalQuestions || !parsedContent.behavioralQuestions) && parsedContent.questions) {
      console.log('Transforming questions array to separate technical and behavioral arrays');
      
      const transformedContent = {
        technicalQuestions: [],
        behavioralQuestions: []
      };
      
      parsedContent.questions.forEach((q: any) => {
        const questionLower = q.question.toLowerCase();
        
        if (questionLower.includes('technical') || 
            questionLower.includes('tool') || 
            questionLower.includes('skill') ||
            questionLower.includes('technology')) {
          transformedContent.technicalQuestions.push(q);
        } else {
          transformedContent.behavioralQuestions.push(q);
        }
      });
      
      // Ensure we have at least some questions
      if (transformedContent.technicalQuestions.length === 0 && parsedContent.questions.length > 0) {
        transformedContent.technicalQuestions.push(parsedContent.questions[0]);
      }
      if (transformedContent.behavioralQuestions.length === 0 && parsedContent.questions.length > 1) {
        transformedContent.behavioralQuestions.push(parsedContent.questions[1]);
      }
      
      parsedContent = transformedContent;
      console.log('Transformed to expected structure');
    }
    
    console.log('Final structure:', 
      'technicalQuestions count:', parsedContent.technicalQuestions?.length || 0,
      'behavioralQuestions count:', parsedContent.behavioralQuestions?.length || 0
    );
    
  } catch (parseError) {
    console.error('Error parsing JSON response:', parseError);
    console.log('Raw response:', generatedContent);
    
    // Fallback: Try to extract JSON from text response
    try {
      console.log('Attempting fallback JSON extraction');
      // Attempt to create a basic structure based on the text
      const fallbackStructure = {
        technicalQuestions: [],
        behavioralQuestions: []
      };
      
      // Simple parsing of questions based on headings
      const sections = generatedContent.split(/#{2,}/);
      for (const section of sections) {
        if (section.toLowerCase().includes('technical questions')) {
          // Extract questions from this section
          const questions = section.split(/\d+\.\s+\*\*Question:\*\*/);
          
          for (let i = 1; i < questions.length; i++) { // Start from 1 to skip header
            const parts = questions[i].split(/\*\*Explanation:\*\*/);
            if (parts.length >= 2) {
              const question = parts[0].trim();
              const explanation = parts[1].split(/\*\*Model Answer:\*\*/)[0].trim();
              let modelAnswer = "";
              let followUp = [];
              
              if (parts[1].includes('**Model Answer:**')) {
                const answerParts = parts[1].split(/\*\*Model Answer:\*\*/);
                if (answerParts.length >= 2) {
                  modelAnswer = answerParts[1].split(/\*\*Follow-Up:\*\*/)[0].trim();
                  
                  if (answerParts[1].includes('**Follow-Up:**')) {
                    const followUpText = answerParts[1].split(/\*\*Follow-Up:\*\*/)[1].trim();
                    followUp = [followUpText];
                  }
                }
              }
              
              fallbackStructure.technicalQuestions.push({
                question,
                explanation,
                modelAnswer,
                followUp
              });
            }
          }
        } else if (section.toLowerCase().includes('behavioral questions')) {
          // Similar extraction for behavioral questions
          const questions = section.split(/\d+\.\s+\*\*Question:\*\*/);
          
          for (let i = 1; i < questions.length; i++) {
            const parts = questions[i].split(/\*\*Explanation:\*\*/);
            if (parts.length >= 2) {
              const question = parts[0].trim();
              const explanation = parts[1].split(/\*\*Model Answer:\*\*/)[0].trim();
              let modelAnswer = "";
              let followUp = [];
              
              if (parts[1].includes('**Model Answer:**')) {
                const answerParts = parts[1].split(/\*\*Model Answer:\*\*/);
                if (answerParts.length >= 2) {
                  modelAnswer = answerParts[1].split(/\*\*Follow-Up:\*\*/)[0].trim();
                  
                  if (answerParts[1].includes('**Follow-Up:**')) {
                    const followUpText = answerParts[1].split(/\*\*Follow-Up:\*\*/)[1].trim();
                    followUp = [followUpText];
                  }
                }
              }
              
              fallbackStructure.behavioralQuestions.push({
                question,
                explanation,
                modelAnswer,
                followUp
              });
            }
          }
        }
      }
      
      if (fallbackStructure.technicalQuestions.length === 0 && fallbackStructure.behavioralQuestions.length === 0) {
        throw new Error('Could not extract questions from response');
      }
      
      parsedContent = fallbackStructure;
      console.log('Created fallback structure:', 
        'technicalQuestions:', parsedContent.technicalQuestions.length,
        'behavioralQuestions:', parsedContent.behavioralQuestions.length
      );
    } catch (fallbackError) {
      console.error('Fallback extraction also failed:', fallbackError);
      throw new Error('Invalid JSON format in the Perplexity response');
    }
  }

  return parsedContent;
}
