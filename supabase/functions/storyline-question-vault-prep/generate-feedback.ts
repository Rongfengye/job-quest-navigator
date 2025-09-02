
import { corsHeaders } from './index.ts';

function detectCompetencyFromQuestion(question: string): string {
  const lowercaseQuestion = question.toLowerCase();
  
  // Leadership competencies
  if (lowercaseQuestion.includes('lead') || lowercaseQuestion.includes('manage') || 
      lowercaseQuestion.includes('team') || lowercaseQuestion.includes('delegate') ||
      lowercaseQuestion.includes('motivate') || lowercaseQuestion.includes('influence')) {
    return 'Leadership & Team Management';
  }
  
  // Communication competencies
  if (lowercaseQuestion.includes('communicate') || lowercaseQuestion.includes('present') ||
      lowercaseQuestion.includes('explain') || lowercaseQuestion.includes('persuade') ||
      lowercaseQuestion.includes('conflict') || lowercaseQuestion.includes('feedback')) {
    return 'Communication & Interpersonal Skills';
  }
  
  // Problem-solving competencies
  if (lowercaseQuestion.includes('problem') || lowercaseQuestion.includes('challenge') ||
      lowercaseQuestion.includes('solve') || lowercaseQuestion.includes('difficult') ||
      lowercaseQuestion.includes('overcome') || lowercaseQuestion.includes('obstacle')) {
    return 'Problem-Solving & Critical Thinking';
  }
  
  // Adaptability competencies
  if (lowercaseQuestion.includes('change') || lowercaseQuestion.includes('adapt') ||
      lowercaseQuestion.includes('flexible') || lowercaseQuestion.includes('learn') ||
      lowercaseQuestion.includes('new') || lowercaseQuestion.includes('different')) {
    return 'Adaptability & Learning';
  }
  
  // Initiative competencies
  if (lowercaseQuestion.includes('initiative') || lowercaseQuestion.includes('proactive') ||
      lowercaseQuestion.includes('improve') || lowercaseQuestion.includes('innovate') ||
      lowercaseQuestion.includes('idea') || lowercaseQuestion.includes('suggest')) {
    return 'Initiative & Innovation';
  }
  
  // Default to general competency
  return 'Professional Skills & Experience';
}

export async function generateAnswer(requestData: any, openAIApiKey: string) {
  const { 
    answerText, 
    question, 
    questionType, 
    jobTitle, 
    jobDescription, 
    companyName 
  } = requestData;

  console.log('Received request to generate feedback for answer');
  console.log('Question type:', questionType);
  console.log('Answer length:', answerText?.length || 0);

  // Detect the primary competency being assessed
  const detectedCompetency = detectCompetencyFromQuestion(question);
  console.log('Detected competency:', detectedCompetency);

  const structureGuidelines = `
    Analyze the candidate's response to the interview question and provide detailed feedback in JSON format with the following sections:
    
    1. "pros" - An array of strings, each highlighting a strength in the answer (be specific about what was good)
    2. "cons" - An array of strings, each highlighting a weakness or area for improvement (be specific and actionable)
    3. "score" - A number between 1-100 representing the overall quality of the answer
    4. "scoreBreakdown" - An object with the following numeric scores (1-100):
       - "structure": How well the answer is organized and follows logical flow
       - "clarity": How clear and understandable the response is
       - "relevance": How well the answer addresses the question asked
       - "specificity": How specific and detailed the examples are
       - "professionalism": How professional and appropriate the response is
    5. "confidence" - A decimal between 0.0-1.0 representing AI confidence in the analysis
    6. "competencyFocus" - A string indicating the primary competency being assessed
    7. "suggestions" - A string with 2-3 specific suggestions to enhance this particular answer
    8. "overall" - A string with an overall assessment and summary of the response quality`

  const questionTypeSpecifications = `For ${questionType || 'interview'} questions, focus on:
  ${questionType === 'technical' ? 
    '- Depth of technical knowledge\n- Clarity of explanation\n- Problem-solving approach\n- Relevant experience with technologies' : 
    questionType === 'behavioral' ? 
    '- Structure \n- Specific examples that demonstrate relevant soft skills\n- Quantifiable results or impact\n- Self-reflection and learning\n- Relevance to the job requirements\n- Depth of experience\n- Challenges faced and solutions implemented\n' :
    '- Clarity and structure\n- Relevance to the question\n- Specific examples\n- Results and impact'}`

  const jobContextSpecifications = `${jobTitle ? `For a ${jobTitle} position` : 'For this position'}
  ${companyName ? `at ${companyName}` : ''}
  ${jobDescription ? `consider how well the answer aligns with these job requirements: """${jobDescription}"""` : ''}`

  const competencyContext = `This question primarily assesses: ${detectedCompetency}
  
  Focus your evaluation on how well the candidate demonstrates competency in this area, considering:
  - Relevant skills and experience in ${detectedCompetency.toLowerCase()}
  - Specific examples that showcase this competency
  - Areas where the candidate could strengthen their demonstration of this skill`

  // Prepare the system prompt
  const systemPrompt = `You are an expert interview coach specializing in providing constructive feedback on interview answers.
  
  ${structureGuidelines}
  
  ${questionTypeSpecifications}
  
  ${jobContextSpecifications}
  
  ${competencyContext}
  
  Make your feedback specific, PERSONALIZED (referring to resume and experience if applicable), actionable, and balanced. The feedback should help the candidate improve their answer while recognizing what they did well.
  
  IMPORTANT: You must return valid JSON with all required fields. The competencyFocus should be set to: "${detectedCompetency}"`;

  // Call the OpenAI API
  const openAIResponse = await fetch('https://oai.helicone.ai/v1/chat/completions', {
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
        { role: 'user', content: `Question: """${question}"""\n\nAnswer: """${answerText}"""` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    }),
  });

  const openAIData = await openAIResponse.json();
  console.log('OpenAI API response received');
  
  if (openAIData.error) {
    console.error('OpenAI API error:', openAIData.error);
    throw new Error(`OpenAI API error: ${openAIData.error.message}`);
  }

  // Extract the feedback from the OpenAI response
  const generatedContent = openAIData.choices[0].message.content;
  console.log('Generated feedback received, parsing JSON');
  
  // Parse the JSON content
  let feedbackContent;
  try {
    feedbackContent = JSON.parse(generatedContent);
    
    // Ensure the structure is valid for enhanced feedback
    if (!feedbackContent.pros || !feedbackContent.cons || !feedbackContent.scoreBreakdown) {
      console.error('Invalid enhanced feedback structure:', feedbackContent);
      throw new Error('OpenAI did not return the expected enhanced data structure');
    }
    
    // Ensure competencyFocus is set
    if (!feedbackContent.competencyFocus) {
      feedbackContent.competencyFocus = detectedCompetency;
    }
    
    // Ensure confidence is set (default to 0.8 if not provided)
    if (!feedbackContent.confidence) {
      feedbackContent.confidence = 0.8;
    }
    
    // Validate scoreBreakdown structure
    const requiredScoreFields = ['structure', 'clarity', 'relevance', 'specificity', 'professionalism'];
    if (!requiredScoreFields.every(field => typeof feedbackContent.scoreBreakdown[field] === 'number')) {
      console.error('Invalid scoreBreakdown structure:', feedbackContent.scoreBreakdown);
      throw new Error('OpenAI did not return valid scoreBreakdown structure');
    }
    
  } catch (parseError) {
    console.error('Error parsing feedback JSON:', parseError);
    throw new Error('Invalid JSON format in the OpenAI response');
  }

  return feedbackContent;
}
