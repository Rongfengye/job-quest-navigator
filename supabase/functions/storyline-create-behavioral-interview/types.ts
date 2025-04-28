export interface RequestBody {
  generateFeedback?: boolean;
  questions?: string[];
  answers?: string[];
  jobTitle: string;
  jobDescription: string;
  companyName: string;
  companyDescription?: string;
  resumeText?: string;
  coverLetterText?: string;
  additionalDocumentsText?: string;
  previousQuestions?: string[];
  previousAnswers?: string[];
  questionIndex?: number;
}

export interface InterviewQuestion {
  question: string;
  questionIndex: number;
  explanation?: string;
}

export interface SonarResponseSchema {
  type: string;
  properties: {
    question?: {
      type: string;
      description: string;
    };
    feedback?: {
      type: string;
      description: string;
    };
  };
  required: string[];
}
