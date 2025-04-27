
export interface QuestionGenerationRequest {
  requestType: 'GENERATE_QUESTION';
  jobTitle: string;
  jobDescription: string;
  companyName?: string;
  companyDescription?: string;
  resumeText?: string;
  coverLetterText?: string;
  additionalDocumentsText?: string;
}

export interface AnswerFeedbackRequest {
  requestType: 'GENERATE_ANSWER';
  answerText: string;
  question: string;
  questionType?: string;
  jobTitle?: string;
  jobDescription?: string;
  companyName?: string;
}

export type RequestData = QuestionGenerationRequest | AnswerFeedbackRequest;

