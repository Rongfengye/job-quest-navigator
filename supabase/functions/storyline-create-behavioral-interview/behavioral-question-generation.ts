
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
  
  if (questionIndex === 0) {
    systemPrompt = `You are an experienced interviewer for a ${jobTitle} position.
    ${companyName ? `The company name is ${companyName}.` : ''}
    ${companyDescription ? `About the company: ${companyDescription}` : ''}
    
    Based on the job description and candidate's resume, generate a thought-provoking behavioral interview question that:
    1. Assesses the candidate's past experiences relevant to this role
    2. Helps evaluate their soft skills and cultural fit
    3. Follows the format of "Tell me about a time when..." or similar open-ended behavioral question
    4. Is specific enough to elicit a detailed STAR (Situation, Task, Action, Result) response
    
    Format your response as a JSON object with:
    - 'question': The main interview question (string)`;
  } else {
    systemPrompt = `You are an experienced interviewer for a ${jobTitle} position conducting a behavioral interview.
    ${companyName ? `The company name is ${companyName}.` : ''}
    ${companyDescription ? `About the company: ${companyDescription}` : ''}
    
    You have already asked the following questions and received these answers:
    ${previousQuestions.map((q, i) => 
      `Question ${i+1}: ${q}\nAnswer: ${previousAnswers[i] || "No answer provided"}`
    ).join('\n\n')}
    
    Based on this conversation history, the job description, and candidate's resume, generate the next behavioral interview question that:
    1. Builds upon the previous conversation naturally
    2. Explores a different aspect of the candidate's experience or skill set not yet covered
    3. Helps assess their fit for this specific role
    4. Is specific enough to elicit a detailed STAR (Situation, Task, Action, Result) response
    
    Make your question feel like a natural follow-up to the previous conversation, as if this were a real interview flow.
    
    Format your response as a JSON object with:
    - 'question': The main interview question (string)`;
  }

  const userPrompt = `
  Job Title: "${jobTitle}"
  Job Description: "${jobDescription}"
  ${companyName ? `Company Name: "${companyName}"` : ''}
  ${companyDescription ? `Company Description: "${companyDescription}"` : ''}
  
  ${resumeText ? `Resume content: "${resumeText}"` : ''}
  ${coverLetterText ? `Cover Letter content: "${coverLetterText}"` : ''}
  ${additionalDocumentsText ? `Additional Documents content: "${additionalDocumentsText}"` : ''}
  
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
