
export type InterviewQuestion = {
  question: string;
  questionIndex: number;
};

export type RequestBody = {
  jobTitle: string;
  jobDescription: string;
  companyName?: string;
  companyDescription?: string;
  resumeText: string;
  coverLetterText?: string;
  additionalDocumentsText?: string;
  previousQuestions?: string[];
  previousAnswers?: string[];
  questionIndex: number;
  generateFeedback?: boolean;
  answers?: string[];
  questions?: string[];
};

export type SonarResponseSchema = {
  type: "object";
  properties: {
    question: {
      type: "string";
      description: "The behavioral interview question"
    };
  };
  required: ["question"];
};

