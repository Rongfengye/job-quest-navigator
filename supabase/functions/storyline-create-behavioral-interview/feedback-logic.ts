import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.4.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};


const structureGuidelines = `Provide feedback in JSON format with the following structure:
  {
    "pros": ["strength 1", "strength 2", ...],
    "cons": ["area for improvement 1", "area for improvement 2", ...],
    "score": <number between 0-100>,
    "scoreBreakdown": {
      "structure": <number between 0-100>,
      "clarity": <number between 0-100>, 
      "relevance": <number between 0-100>,
      "specificity": <number between 0-100>,
      "professionalism": <number between 0-100>
    },
    "confidence": <number between 0.0-1.0>,
    "competencyFocus": "<primary competency being assessed>",
    "suggestions": "specific suggestions for improvement",
    "overall": "brief overall assessment"
  }`

const considerationGuidelines = `Consider:
  1. Overall structure and logical flow of the response
  2. Relevance to the question asked
  3. Clarity, Specificity, and detail level
  4. Professional communication
  5. Alignment with job requirements`

const contentConsiderations = `Additionally, please keep these in mind:
  1. Place emphasis on having concrete examples that demonstrate self-reflection, growth, and lessons learned.
  2. Ensure background context is appropriately balanced with actions taken and outcomes achieved.
  3. When identifying structural weaknesses, focus on logical flow and completeness rather than adherence to specific frameworks 
  4. When applicable, refer to specific parts of the response to explain strengths and weaknesses
  5. Group similar critiques into a single point where possible to avoid redundancy.
  6. In the 'suggestions' section, build on the 'cons' by proposing **specific ways to improve**, such as example techniques, frameworks, or prompts.  
  7. Respond directly addressing the user with 'You ___' rather than describing the person's responses in third person.

  Base your score (0–100) on a weighted evaluation of:
  - How well the answer is organized and follows logical flow (structure score)
  - Specificity of examples (specificity score)
  - Relevance to the question (relevance score)
  - Clarity and communication quality (clarity score)
  - Professionalism and tone (professionalism score)
  
  Provide individual scores for each dimension in scoreBreakdown.
  Set confidence (0.0-1.0) based on how certain you are about your evaluation.
  Identify the primary competency being assessed in competencyFocus.
`

// Renamed from generateFeedback to avoid collision with the generateFeedback boolean input parameter
export async function generateFeedbackHelper(
  openAIApiKey: string,
  supabase: ReturnType<typeof createClient>,
  questions: string[],
  answers: string[],
  questionTopics: string[] = [],
  jobTitle: string = '',
  companyName: string = '',
  companyDescription: string = '',
  jobDescription: string = '',
  resumeText: string = ''
) {
  // Safety check: make sure questions and answers arrays are valid
  if (!Array.isArray(questions) || !Array.isArray(answers)) {
    console.error('Invalid inputs for feedback generation:', { 
      questionsIsArray: Array.isArray(questions), 
      answersIsArray: Array.isArray(answers) 
    });
    throw new Error('Invalid questions or answers data provided for feedback generation');
  }
  
  // Check if we have enough questions and answers to generate feedback
  if (questions.length < 5 || answers.length < 5) {
    console.error('Not enough questions or answers for feedback generation:', { 
      questionsCount: questions.length, 
      answersCount: answers.length,
      questions,
      answers
    });
    throw new Error(`Not enough questions or answers to generate feedback. 
      Questions: ${questions.length}, Answers: ${answers.length}`);
  }

  console.log(`Generating feedback for ${questions.length} questions and ${answers.length} answers`);
  
  // Validate all array entries
  for (let i = 0; i < 5; i++) {
    if (!questions[i] || typeof questions[i] !== 'string' || !questions[i].trim()) {
      console.error(`Invalid question at index ${i}:`, questions[i]);
      throw new Error(`Invalid question at index ${i}`);
    }
    if (!answers[i] || typeof answers[i] !== 'string' || !answers[i].trim()) {
      console.error(`Invalid answer at index ${i}:`, answers[i]);
      throw new Error(`Invalid answer at index ${i}`);
    }
  }

  // Make sure we have the same number of questions and answers
  const feedbackLength = Math.min(questions.length, answers.length);
  
  const feedbackPromises = [];
  
  // Only process questions that have corresponding answers
  for (let index = 0; index < feedbackLength; index++) {
    if (!questions[index] || !answers[index]) {
      console.log(`Skipping feedback for index ${index} due to missing question or answer`);
      continue;
    }
    
    const systemPrompt = `You are an expert behavioral interview evaluator for a ${jobTitle || 'professional'} position.
    ${companyName ? `The company name is ${companyName}.` : ''}
    ${companyDescription ? `About the company: ${companyDescription}` : ''}
    ${jobDescription ? `Job Description: ${jobDescription}` : ''}
    ${resumeText ? `Based on the candidate's resume: ${resumeText}` : ''}
    ${questionTopics[index] ? `This question explores the competency: "${questionTopics[index]}"` : ''}
    Your task is to provide detailed, PERSONALIZED (referring to resume and experience if applicable), and constructive feedback on the candidate's response.
    
    ${considerationGuidelines}
    
    ${contentConsiderations}
    
    ${structureGuidelines}`;

    console.log(`Processing feedback for question ${index + 1}: ${questions[index].substring(0, 50)}...`);
    console.log(`Processing answer ${index + 1}: ${answers[index].substring(0, 50)}...`);

    const feedbackPromise = fetch('https://oai.helicone.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Helicone-Auth': `Bearer ${Deno.env.get('HELICONE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Question: """${questions[index]}""" \n\nAnswer: """${answers[index]}"""` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      }),
    }).then(response => response.json())
      .then(data => {
        if (data.error) {
          console.error(`Error from OpenAI for question ${index + 1}:`, data.error);
          // Return a default feedback object if there's an error
          return {
            pros: ["Unable to analyze response"],
            cons: ["Error generating feedback"],
            score: 0,
            scoreBreakdown: { structure: 0, clarity: 0, relevance: 0, specificity: 0, professionalism: 0 },
            confidence: 0.0,
            competencyFocus: "Unknown",
            suggestions: "Please try again later.",
            overall: "Error in feedback generation"
          };
        }
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          console.error(`Unexpected response format from OpenAI for question ${index + 1}:`, data);
          // Return a default feedback object
          return {
            pros: ["Unable to analyze response"],
            cons: ["Unexpected response format"],
            score: 0,
            scoreBreakdown: { structure: 0, clarity: 0, relevance: 0, specificity: 0, professionalism: 0 },
            confidence: 0.0,
            competencyFocus: "Unknown",
            suggestions: "Please try again later.",
            overall: "Error in feedback generation"
          };
        }
        
        try {
          return JSON.parse(data.choices[0].message.content);
        } catch (parseError) {
          console.error(`Error parsing OpenAI response for question ${index + 1}:`, parseError);
          console.log('Raw response:', data.choices[0].message.content);
          // Return a default feedback object
          return {
            pros: ["Unable to analyze response"],
            cons: ["Error parsing feedback"],
            score: 0,
            scoreBreakdown: { structure: 0, clarity: 0, relevance: 0, specificity: 0, professionalism: 0 },
            confidence: 0.0,
            competencyFocus: "Unknown",
            suggestions: "Please try again later.",
            overall: "Error in feedback generation"
          };
        }
      })
      .catch(error => {
        console.error(`Network error while getting feedback for question ${index + 1}:`, error);
        // Return a default feedback object
        return {
          pros: ["Unable to analyze response"],
          cons: ["Network error"],
          score: 0,
          scoreBreakdown: { structure: 0, clarity: 0, relevance: 0, specificity: 0, professionalism: 0 },
          confidence: 0.0,
          competencyFocus: "Unknown",
          suggestions: "Please try again later.",
          overall: "Error in feedback generation"
        };
      });
    
    feedbackPromises.push(feedbackPromise);
  }

  // Wait for all feedback to be generated
  const feedbackResults = await Promise.all(feedbackPromises);
  console.log(`Successfully generated ${feedbackResults.length} feedback entries`);

  if (!feedbackResults || feedbackResults.length === 0) {
    throw new Error('Failed to generate any feedback results');
  }

  return feedbackResults;
}