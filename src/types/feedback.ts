
export interface FeedbackFormData {
  feedback: string;
  email?: string;
  quickPrompt?: string;
}

export interface FeedbackSubmissionResponse {
  success: boolean;
  message: string;
  feedback_count?: number;
  error?: string;
}

export const QUICK_FEEDBACK_PROMPTS = [
  "I love this feature!",
  "Something isn't working correctly",
  "I have a suggestion for improvement",
  "The interface is confusing",
  "This saved me time",
  "I need help with something"
] as const;
