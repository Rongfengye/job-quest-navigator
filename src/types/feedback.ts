
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
  {
    label: "I love this feature!",
    starter: "I love this feature!"
  },
  {
    label: "What could be improved on this page?",
    starter: "I think this page could be improved by... "
  },
  {
    label: "Did you find this tool helpful?",
    starter: "This tool was helpful because... "
  },
  {
    label: "Any suggestions for new features?",
    starter: "I’d love to see a feature that... "
  },
  {
    label: "Report a bug or issue",
    starter: "I encountered an issue where... "
  }
] as const;
