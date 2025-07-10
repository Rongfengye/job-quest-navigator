
import { AnswerIteration } from '@/hooks/useAnswers';

// Feature flag to control technical questions processing (matches backend and frontend)
const ENABLE_TECHNICAL_QUESTIONS = false;

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
 * Filters out technical questions based on feature flag
 */
export const parseOpenAIResponse = (response: any): any[] => {
  if (response.questions) {
    // Filter out technical questions if feature flag is disabled
    return ENABLE_TECHNICAL_QUESTIONS 
      ? response.questions
      : response.questions.filter((q: any) => q.type !== 'technical');
  } else if (
    response.technicalQuestions && 
    response.behavioralQuestions
  ) {
    // Only include technical questions if feature flag is enabled
    const technical = ENABLE_TECHNICAL_QUESTIONS 
      ? response.technicalQuestions.map((q: any) => ({
          ...q, type: 'technical' as const
        }))
      : [];
    
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
