
import { AnswerIteration } from '@/hooks/useAnswers';

/**
 * Transforms iterations data ensuring consistent format
 */
export const transformIterations = (iterations: any[]): AnswerIteration[] => {
  return iterations.map((iteration: any) => {
    if (iteration.text && !iteration.answerText) {
      return {
        answerText: iteration.text,
        timestamp: iteration.timestamp,
        ...(iteration.feedback ? { feedback: iteration.feedback } : {})
      };
    }
    return iteration;
  });
};

/**
 * Parses OpenAI response to extract questions array including original behavioral questions
 */
export const parseOpenAIResponse = (response: any): any[] => {
  if (response.questions) {
    return response.questions;
  } else if (
    response.technicalQuestions && 
    response.behavioralQuestions
  ) {
    const technical = response.technicalQuestions.map((q: any) => ({
      ...q, type: 'technical' as const
    }));
    
    const behavioral = response.behavioralQuestions.map((q: any) => ({
      ...q, type: 'behavioral' as const
    }));
    
    // Include original behavioral questions if they exist
    const originalBehavioral = response.originalBehavioralQuestions 
      ? response.originalBehavioralQuestions.map((q: any) => ({
          ...q, type: 'original-behavioral' as const
        }))
      : [];
    
    return [...technical, ...behavioral, ...originalBehavioral];
  }
  return [];
};
