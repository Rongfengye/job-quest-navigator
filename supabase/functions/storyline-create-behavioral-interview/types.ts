export interface SonarResponseSchema {
  $schema?: string;
  type: string;
  additionalProperties?: boolean;
  properties: {
    question?: {
      type: string;
      description: string;
    };
    feedback?: {
      type: string;
      additionalProperties?: boolean;
      properties: {
        overallAssessment?: { type: string };
        strengthsAndWeaknesses?: {
          type: string;
          properties: {
            strengths: { type: string; items: { type: string } };
            weaknesses: { type: string; items: { type: string } };
          };
        };
        individualResponses?: {
          type: string;
          items: {
            type: string;
            properties: {
              questionIndex: { type: string };
              strengths: { type: string; items: { type: string } };
              improvements: { type: string; items: { type: string } };
              score: { type: string };
            };
          };
        };
        improvementPlan?: { type: string };
        overallScore?: { type: string };
      };
      required?: string[];
    };
  };
  required: string[];
}

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
