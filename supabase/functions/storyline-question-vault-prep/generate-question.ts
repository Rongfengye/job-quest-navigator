
import { corsHeaders } from './index.ts';

// Feature flag to control technical question generation
const ENABLE_TECHNICAL_QUESTIONS = false;

export async function generateQuestion(requestData: any, perplexityApiKey: string) {
  const { 
    jobTitle, 
    jobDescription, 
    companyName, 
    companyDescription, 
    resumeText, 
    coverLetterText, 
    additionalDocumentsText,
    originalBehavioralQuestions = [] // New parameter for original questions
  } = requestData;

  console.log('Received request to generate interview questions');
  console.log('Resume text length:', resumeText?.length || 0);
  console.log('Original behavioral questions count:', originalBehavioralQuestions.length);
  console.log('Technical questions enabled:', ENABLE_TECHNICAL_QUESTIONS);

  const formatSpecification = `
  Your response MUST be a valid JSON object in the following format:
  {
    ${ENABLE_TECHNICAL_QUESTIONS ? `"technicalQuestions": [
      {
        "question": "string",
        "explanation": "string",
        "modelAnswer": "string (STAR format)",
        "followUp": ["string"]
      }
    ],` : ''}
    "behavioralQuestions": [
      {
        "question": "string",
        "explanation": "string",
        "modelAnswer": "string (STAR format)",
        "followUp": ["string"]
      }
    ]
  }
  `

  const suggestedWebsiteList = 'Glassdoor, Reddit, Blind, Wall Street Oasis, OneClass, Fishbowl, PrepLounge, Quora, LeetCode Discuss, Indeed'

  // Sonar system prompt
  const sonarSystemPrompt = `You are an experienced interviewer for a ${jobTitle} position.
  ${companyName ? `The company name is ${companyName}.` : ''}
  ${companyDescription ? `About the company: """${companyDescription}"""` : ''}
  ${jobDescription ? `About the job: """${jobDescription}"""` : ''}`

  const searchSpecification = `Search the web across hiring forums, ${companyName}'s website, and job review sites (such as ${suggestedWebsiteList}) to find interview questions that have actually been asked by ${companyName} for the role the candidate is applying to. 
  If you find such questions, prioritize them in the list of returned questions. 
  If not, generate questions based on the job description and candidate profile.`

  // Create the user prompt with conditional question generation
  const questionCount = ENABLE_TECHNICAL_QUESTIONS ? 10 : 5;
  const questionTypes = ENABLE_TECHNICAL_QUESTIONS 
    ? `- 5 technical questions focused on entry-level technical skills and problem-solving
    - 5 behavioral questions focused on teamwork, learning, and project experience`
    : `- 5 behavioral questions focused on teamwork, learning, and project experience`;

  const userPrompt = `
  Candidate Documents and Context:
  ${resumeText ? `Resume content: "${resumeText}"` : ''}
  ${coverLetterText ? `Cover Letter content: "${coverLetterText}"` : ''}
  ${additionalDocumentsText ? `Additional Documents content: "${additionalDocumentsText}"` : ''}

  Based on the provided information, generate ${questionCount} interview questions:
  ${questionTypes}

  ${searchSpecification}

  ${formatSpecification}
  `;

  // Define the JSON schema for response format with conditional technical questions
  const responseSchema = {
    "type": "object",
    "properties": {
      ...(ENABLE_TECHNICAL_QUESTIONS && {
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
        }
      }),
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
    "required": ENABLE_TECHNICAL_QUESTIONS ? ["technicalQuestions", "behavioralQuestions"] : ["behavioralQuestions"]
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
      model: 'sonar',
      messages: [
        { role: 'system', content: sonarSystemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
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
      ENABLE_TECHNICAL_QUESTIONS ? (
        'technicalQuestions' in parsedContent ? 'has technicalQuestions' : 'no technicalQuestions'
      ) : 'technical questions disabled',
      'behavioralQuestions' in parsedContent ? 'has behavioralQuestions' : 'no behavioralQuestions',
      'questions' in parsedContent ? 'has questions' : 'no questions'
    );
    
    // Check if the response structure is valid based on feature flag
    const hasRequiredStructure = ENABLE_TECHNICAL_QUESTIONS 
      ? (parsedContent.technicalQuestions && parsedContent.behavioralQuestions)
      : parsedContent.behavioralQuestions;

    if (!hasRequiredStructure && !parsedContent.questions) {
      console.error('Invalid response structure:', JSON.stringify(parsedContent).substring(0, 200));
      throw new Error('Perplexity did not return the expected data structure');
    }
    
    // Transform if the response doesn't match our expected structure
    if (!hasRequiredStructure && parsedContent.questions) {
      console.log('Transforming questions array to separate technical and behavioral arrays');
      
      const transformedContent = {
        ...(ENABLE_TECHNICAL_QUESTIONS && { technicalQuestions: [] }),
        behavioralQuestions: []
      };
      
      parsedContent.questions.forEach((q: any) => {
        const questionLower = q.question.toLowerCase();
        
        if (ENABLE_TECHNICAL_QUESTIONS && (
            questionLower.includes('technical') || 
            questionLower.includes('tool') || 
            questionLower.includes('skill') ||
            questionLower.includes('technology'))) {
          transformedContent.technicalQuestions!.push(q);
        } else {
          transformedContent.behavioralQuestions.push(q);
        }
      });
      
      // Ensure we have at least some questions
      if (ENABLE_TECHNICAL_QUESTIONS && transformedContent.technicalQuestions!.length === 0 && parsedContent.questions.length > 0) {
        transformedContent.technicalQuestions!.push(parsedContent.questions[0]);
      }
      if (transformedContent.behavioralQuestions.length === 0 && parsedContent.questions.length > 1) {
        transformedContent.behavioralQuestions.push(parsedContent.questions[1]);
      }
      
      parsedContent = transformedContent;
      console.log('Transformed to expected structure');
    }
    
    console.log('Final structure:', 
      ENABLE_TECHNICAL_QUESTIONS ? (
        'technicalQuestions count:', parsedContent.technicalQuestions?.length || 0
      ) : 'technical questions disabled',
      'behavioralQuestions count:', parsedContent.behavioralQuestions?.length || 0
    );
    
  } catch (parseError) {
    console.error('Error parsing JSON response:', parseError);
    console.log('Raw response:', generatedContent);
    
    throw new Error('Invalid JSON format in the Perplexity response');
  }

  // Initialize technical questions as empty array if disabled (to maintain structure)
  if (!ENABLE_TECHNICAL_QUESTIONS && !parsedContent.technicalQuestions) {
    parsedContent.technicalQuestions = [];
  }

  // NEW: Combine original behavioral questions with newly generated ones
  if (originalBehavioralQuestions.length > 0) {
    console.log('Adding original behavioral questions to the response');
    
    // Convert original questions to the expected format
    const formattedOriginalQuestions = originalBehavioralQuestions.map((question: string, index: number) => ({
      question: question,
      explanation: "This question was from your behavioral interview practice session.",
      modelAnswer: "Use the STAR method (Situation, Task, Action, Result) to structure your response based on your previous answer during the interview.",
      followUp: [`Can you elaborate on the results you achieved?`, `What would you do differently next time?`],
      type: 'original-behavioral' as const,
      originalIndex: index
    }));

    // Add original questions to the parsed content
    parsedContent.originalBehavioralQuestions = formattedOriginalQuestions;
    
    console.log('Added', formattedOriginalQuestions.length, 'original behavioral questions');
  }

  return parsedContent;
}
