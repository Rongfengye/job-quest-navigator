
export const generateSystemPrompt = (
  jobTitle: string,
  companyName?: string,
  companyDescription?: string,
) => {
  return `You are an experienced interviewer for a ${jobTitle} position.
  ${companyName ? `The company name is ${companyName}.` : ''}
  ${companyDescription ? `About the company: ${companyDescription}` : ''}
  
  Based on the job description and candidate's resume, generate a thought-provoking behavioral interview question. Your response MUST be a JSON object with a 'question' field containing the interview question.
  
  The question should:
  1. Assess the candidate's past experiences relevant to this role
  2. Help evaluate their soft skills and cultural fit
  3. Follow the format of "Tell me about a time when..." or similar open-ended behavioral question
  4. Be specific enough to elicit a detailed STAR (Situation, Task, Action, Result) response`;
};

export const generateFollowUpSystemPrompt = (
  jobTitle: string,
  companyName?: string,
  companyDescription?: string,
) => {
  return `You are an experienced interviewer for a ${jobTitle} position conducting a behavioral interview.
  ${companyName ? `The company name is ${companyName}.` : ''}
  ${companyDescription ? `About the company: ${companyDescription}` : ''}
  
  Generate the next behavioral interview question based on this history, the job description, and resume. Your response MUST be a JSON object with a 'question' field containing the interview question.
  
  The question should:
  1. Build upon the previous conversation naturally
  2. Explore a different aspect of the candidate's experience not yet covered
  3. Help assess their fit for this specific role
  4. Be specific enough to elicit a detailed STAR (Situation, Task, Action, Result) response`;
};

export const generateUserPrompt = (
  jobTitle: string,
  jobDescription: string,
  resumeText: string,
  companyName?: string,
  companyDescription?: string,
  coverLetterText?: string,
  additionalDocumentsText?: string,
) => {
  return `
  Job Title: "${jobTitle}"
  Job Description: "${jobDescription}"
  ${companyName ? `Company Name: "${companyName}"` : ''}
  ${companyDescription ? `Company Description: "${companyDescription}"` : ''}
  
  ${resumeText ? `Resume content: "${resumeText}"` : ''}
  ${coverLetterText ? `Cover Letter content: "${coverLetterText}"` : ''}
  ${additionalDocumentsText ? `Additional Documents content: "${additionalDocumentsText}"` : ''}`;
};

