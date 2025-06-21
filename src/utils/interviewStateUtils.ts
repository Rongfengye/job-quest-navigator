
export interface InterviewState {
  status: 'complete' | 'in-progress' | 'not-started';
  currentQuestionIndex: number;
  totalQuestions: number;
  canResume: boolean;
}

export const analyzeInterviewState = (
  questions: any[] | null,
  responses: any[] | null,
  feedback: any[] | null
): InterviewState => {
  const questionsArray = Array.isArray(questions) ? questions : [];
  const responsesArray = Array.isArray(responses) ? responses : [];
  const feedbackArray = Array.isArray(feedback) ? feedback : [];
  
  // Check if interview is complete (has actual feedback content)
  const isComplete = feedbackArray.length > 0 && responsesArray.length >= 5;
  
  // Check if interview has started (has questions)
  const hasStarted = questionsArray.length > 0;
  
  if (isComplete) {
    return {
      status: 'complete',
      currentQuestionIndex: questionsArray.length,
      totalQuestions: questionsArray.length,
      canResume: false
    };
  }
  
  if (hasStarted) {
    return {
      status: 'in-progress',
      currentQuestionIndex: responsesArray.length,
      totalQuestions: questionsArray.length,
      canResume: responsesArray.length < questionsArray.length
    };
  }
  
  return {
    status: 'not-started',
    currentQuestionIndex: 0,
    totalQuestions: 0,
    canResume: false
  };
};
