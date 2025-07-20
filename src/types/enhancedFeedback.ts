export interface ScoreBreakdown {
  structure: number;
  clarity: number;
  relevance: number;
  specificity: number;
  professionalism: number;
}

export interface EnhancedFeedbackData {
  pros: string[];
  cons: string[];
  score: number;
  scoreBreakdown: ScoreBreakdown;
  confidence: number;
  competencyFocus: string;
  suggestions: string;
  overall: string;
}

// Legacy interface for backward compatibility
export interface LegacyFeedbackData {
  pros: string[];
  cons: string[];
  guidelines?: string;
  improvementSuggestions?: string;
  score: number;
  suggestions?: string;
  overall?: string;
}

// Union type to handle both legacy and enhanced feedback
export type FeedbackData = EnhancedFeedbackData | LegacyFeedbackData;

// Type guard to check if feedback is enhanced
export function isEnhancedFeedback(feedback: FeedbackData): feedback is EnhancedFeedbackData {
  return 'scoreBreakdown' in feedback && 'confidence' in feedback && 'competencyFocus' in feedback;
}