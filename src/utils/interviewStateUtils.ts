
export interface InterviewState {
  isComplete: boolean;
  canResume: boolean;
  resumeIndex: number;
  totalQuestions: number;
  totalResponses: number;
}

export const analyzeInterviewState = (
  questions: any[] | null,
  responses: any[] | null,
  feedback: any
): InterviewState => {
  const questionsArray = Array.isArray(questions) ? questions : [];
  const responsesArray = Array.isArray(responses) ? responses : [];
  const totalQuestions = questionsArray.length;
  const totalResponses = responsesArray.length;
  
  // Interview is complete if feedback exists as a non-empty array or object with content
  const isComplete = feedback && (
    (Array.isArray(feedback) && feedback.length > 0) ||
    (typeof feedback === 'object' && !Array.isArray(feedback) && Object.keys(feedback).length > 0)
  ) && totalResponses >= 5;
  
  // Can resume if we have questions but not all responses, and no actual feedback yet
  const canResume = totalQuestions > 0 && totalResponses < 5 && !isComplete;
  
  // Resume from the next question after the last response
  const resumeIndex = Math.max(0, totalResponses);
  
  return {
    isComplete,
    canResume,
    resumeIndex,
    totalQuestions,
    totalResponses
  };
};

export const isInterviewComplete = (behavioral: any): boolean => {
  const state = analyzeInterviewState(behavioral.questions, behavioral.responses, behavioral.feedback);
  return state.isComplete;
};

export const canResumeInterview = (behavioral: any): boolean => {
  const state = analyzeInterviewState(behavioral.questions, behavioral.responses, behavioral.feedback);
  return state.canResume;
};

export const getResumePoint = (behavioral: any): number => {
  const state = analyzeInterviewState(behavioral.questions, behavioral.responses, behavioral.feedback);
  return state.resumeIndex;
};
