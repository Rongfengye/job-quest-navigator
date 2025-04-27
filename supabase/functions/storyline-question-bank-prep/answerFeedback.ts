
import { AnswerFeedbackRequest } from "./types.ts";

export const generateAnswerFeedback = async (
  data: AnswerFeedbackRequest,
  openAIApiKey: string
) => {
  const systemPrompt = `You are an expert interview coach specializing in providing constructive feedback on interview answers.
      
  Analyze the candidate's response to the interview question and provide detailed feedback in JSON format with the following sections:
  
  1. "pros" - An array of strings, each highlighting a strength in the answer (be specific about what was good)
  2. "cons" - An array of strings, each highlighting a weakness or area for improvement (be specific and actionable)
  3. "guidelines" - A string with concise guidelines on how to better answer this type of question
  4. "improvementSuggestions" - A string with 2-3 specific suggestions to enhance this particular answer
  5. "score" - A number between 1-100 representing the overall quality of the answer
  
  For ${data.questionType || 'interview'} questions, focus on:
  ${data.questionType === 'technical' ? 
    '- Depth of technical knowledge\n- Clarity of explanation\n- Problem-solving approach\n- Relevant experience with technologies' : 
    data.questionType === 'behavioral' ? 
    '- Structure using the STAR method (Situation, Task, Action, Result)\n- Specific examples that demonstrate relevant soft skills\n- Quantifiable results or impact\n- Self-reflection and learning\n- Relevance to the job requirements\n- Depth of experience\n- Challenges faced and solutions implemented\n- Measurable achievements and impact' :
    '- Clarity and structure\n- Relevance to the question\n- Specific examples\n- Results and impact'}
  
  ${data.jobTitle ? `For a ${data.jobTitle} position` : 'For this position'}
  ${data.companyName ? `at ${data.companyName}` : ''}
  ${data.jobDescription ? `consider how well the answer aligns with these job requirements: ${data.jobDescription}` : ''}
  
  Make your feedback specific, actionable, and balanced. The feedback should help the candidate improve their answer while recognizing what they did well.`;

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
        { role: 'user', content: `Question: ${data.question}\n\nAnswer: ${data.answerText}` }
      ],
      response_format: { type: "json_object" }
    }),
  });

  return openAIResponse;
};

