
// Separate module for generating behavioral interview questions
export async function generateBehavioralQuestion(
  openAIApiKey: string,
  questionIndex: number,
  jobTitle: string,
  jobDescription: string,
  companyName: string,
  companyDescription: string,
  resumeText: string,
  coverLetterText: string,
  additionalDocumentsText: string,
  previousQuestions: string[] = [],
  previousAnswers: string[] = []
) {
  let systemPrompt = '';

  const companyContextString = `You are an experienced interviewer for a ${jobTitle} position.
  ${companyName ? `The company name is ${companyName}.` : ''}
  ${companyDescription ? `About the company: """${companyDescription}"""` : ''}
  ${jobDescription ? `About the job: """${jobDescription}"""` : ''}`

  const formatRequirement = `
  Do not include any explanation, reasoning, or additional text. Only return the response as a JSON object like:
    {
      - 'question': The main interview question (string)
    }
  `
  
  // NOTE TO SELF, DO NOT DELETE
  // It is a very dense prompt, so we have to find a balance between Prompt Bloat/Context Window Saturation/Instruction Dilution/Semantic Overload
  if (questionIndex === 0) {
    const fewShotQuestionList = `
    Here are examples of thoughtful behavioral questions often used to evaluate early-career candidates:

    - "Tell me about a time when you worked with someone who had a very different communication or work style than you. How did you navigate that?"
    - "Describe a situation where you had to learn something unfamiliar quickly to succeed."
    - "Tell me about a time you failed or fell short of your goals. What did you take away from the experience?"
    - "Share how you've handled managing multiple competing priorities — what worked and what didn’t?"
    - "Describe a time when you took initiative on a project, even though it wasn’t expected of you."
    - "Tell me about a team project where you made a meaningful impact. What specifically did you contribute?"
    - "Give an example of a time you received difficult or constructive feedback. How did you respond, and what changed afterward?"
    - "Describe a time when you had to approach a problem differently than others around you. What did you do?"
    - "Tell me about a moment when you were under a tight deadline. How did you decide what to focus on?"
    - "Describe a time when you had to persuade someone — a teammate, a classmate, or a leader — to support your idea."

    These are examples to guide the tone and depth of your response. Your question should be tailored to the candidate's background and the job description.
    `

    // NOTE TO SELF, DO NOT DELETE
    // We may want to look into providing 10 example behaviorals, which would allow for few-shot prompting
    // However this is something we need to test out, as there is a tradeoff between guiding the model and constraining it
    // Can read up on semantic anchoring more

    systemPrompt = `${companyContextString}
    
    Based on the job description and candidate's resume, generate a thought-provoking behavioral interview question that:
    1. Assesses the candidate's past experiences relevant to this role
    2. Helps evaluate their soft skills and cultural fit
    3. Follows the format of "Tell me about a time when..." or similar open-ended behavioral question
    4. Is specific enough to elicit a detailed STAR (Situation, Task, Action, Result) response

    ${fewShotQuestionList}
    
    ${formatRequirement}`;
  } else {
    systemPrompt = `${companyContextString}
    
    You have already asked the following questions and received these answers:
    ${previousQuestions.map((q, i) => 
      `Q${i+1}: """${q}"""\nA${i+1}: """${previousAnswers[i] || "No answer provided"}"""`
    ).join('\n\n')}
    
    Based on this conversation history, the job description, and candidate's resume, generate the next behavioral interview question that:
    1. Builds upon the previous conversation naturally
    2. Explores a different aspect of the candidate's experience or skill set not yet covered
    3. Helps assess their fit for this specific role
    4. Is specific enough to elicit a detailed STAR (Situation, Task, Action, Result) response
    
    Make your question feel like a natural follow-up to the previous conversation, as if this were a real interview flow.
    
    ${formatRequirement}`;
  }

  const userPrompt = `
  Candidate Documents and Context:
  
  ${resumeText ? `Resume content: """${resumeText}"""` : ''}
  ${coverLetterText ? `Cover Letter content: """${coverLetterText}"""` : ''}
  ${additionalDocumentsText ? `Additional Documents content: """${additionalDocumentsText}"""` : ''}
  
  ${questionIndex > 0 ? 'Please generate the next question in the interview sequence, based on the conversation history provided in the system prompt.' : 'Please generate the first behavioral interview question for this candidate.'}
  `;

  console.log('Calling OpenAI API for question generation');

  const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: "json_object" }
    }),
  });

  const openAIData = await openAIResponse.json();
  console.log('OpenAI API response received for question');

  if (openAIData.error) {
    console.error('OpenAI API error:', openAIData.error);
    throw new Error(`OpenAI API error: ${openAIData.error.message}`);
  }

  const generatedContent = openAIData.choices[0].message.content;
  console.log('Generated question:', generatedContent.substring(0, 100) + '...');

  let parsedContent;
  try {
    if (typeof generatedContent === 'string') {
      parsedContent = JSON.parse(generatedContent);
    } else {
      parsedContent = generatedContent;
    }
    
    if (!parsedContent.question) {
      console.error('Invalid response structure:', parsedContent);
      throw new Error('OpenAI did not return the expected data structure');
    }
  } catch (parseError) {
    console.error('Error parsing JSON response:', parseError);
    console.log('Raw response:', generatedContent);
    throw new Error('Invalid JSON format in the OpenAI response');
  }
  
  return parsedContent;
}
