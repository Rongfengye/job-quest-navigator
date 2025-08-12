// Pure validation functions with NO external dependencies
// No React imports, no hooks, no complex dependencies

export interface ValidationResult {
  wordCount: number;
  sentenceCount: number;
  uniqueWordCount: number;
  isValid: boolean;
  warnings: string[];
  metrics: {
    avgWordLength: number;
    hasMinimumContent: boolean;
    hasStructure: boolean;
    repetitionScore: number; // 0-1, lower is better
  };
}

export interface ValidationThresholds {
  minWordCount: number;
  minSentenceCount: number;
  minUniqueWords: number;
}

// Consistent thresholds for all questions (Option C: Middle Ground)
export const CONSISTENT_THRESHOLDS: ValidationThresholds = {
  minWordCount: 50,
  minSentenceCount: 3,
  minUniqueWords: 15,
};

// Common English stop words to exclude from unique word count
const STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have',
  'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you',
  'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they',
  'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one',
  'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out',
  'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when',
  'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
  'take', 'people', 'into', 'year', 'your', 'good', 'some',
  'could', 'them', 'see', 'other', 'than', 'then', 'now',
  'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
  'well', 'way', 'even', 'new', 'want', 'because', 'any',
  'these', 'give', 'day', 'most', 'us', 'is', 'was', 'are',
  'been', 'has', 'had', 'were', 'am', 'being', 'have', 'has', 'having'
]);

export function countWords(text: string): number {
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  return words.length;
}

export function countSentences(text: string): number {
  // Match sentences ending with ., !, or ?
  // Handle edge cases like "Mr." or "Dr."
  const sentences = text
    .replace(/\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr)\./g, '') // Remove common abbreviations
    .split(/[.!?]+/)
    .filter(sentence => sentence.trim().length > 10); // Minimum sentence length
  
  return sentences.length;
}

export function countUniqueWords(text: string): number {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word)); // Exclude short and stop words
  
  const uniqueWords = new Set(words);
  return uniqueWords.size;
}

export function calculateRepetitionScore(text: string): number {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2);
  
  if (words.length === 0) return 1;
  
  const wordCounts = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate how many words appear more than once
  const repeatedWords = Object.values(wordCounts).filter(count => count > 1).length;
  const uniqueWords = Object.keys(wordCounts).length;
  
  return repeatedWords / uniqueWords;
}

export function detectSpamPatterns(text: string): string[] {
  const warnings: string[] = [];
  
  // Check for repeated short phrases
  const words = text.toLowerCase().split(/\s+/);
  if (words.length >= 3) {
    for (let i = 0; i < words.length - 2; i++) {
      const phrase = words.slice(i, i + 3).join(' ');
      const occurrences = (text.toLowerCase().match(new RegExp(phrase, 'g')) || []).length;
      if (occurrences > 10) {
        warnings.push(`Repeated phrase detected: "${phrase}"`);
        break;
      }
    }
  }
  
  // Check for single word repeated many times
  const wordCounts = words.reduce((acc, word) => {
    if (word.length > 15) {
      acc[word] = (acc[word] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  Object.entries(wordCounts).forEach(([word, count]) => {
    if (count > 5 && count / words.length > 0.2) {
      warnings.push(`Word "${word}" appears too frequently (${count} times)`);
    }
  });
  
  // Check for Lorem Ipsum
  if (/lorem\s+ipsum/i.test(text)) {
    warnings.push('Lorem Ipsum placeholder text detected');
  }
  
  // Check for keyboard mashing
  if (/([a-z])\1{4,}/i.test(text)) {
    warnings.push('Keyboard mashing pattern detected');
  }
  
  return warnings;
}

export function validateAnswer(
  text: string, 
  thresholds: ValidationThresholds = CONSISTENT_THRESHOLDS
): ValidationResult {
  const wordCount = countWords(text);
  const sentenceCount = countSentences(text);
  const uniqueWordCount = countUniqueWords(text);
  const repetitionScore = calculateRepetitionScore(text);
  const spamWarnings = detectSpamPatterns(text);
  
  const warnings: string[] = [...spamWarnings];
  
  // Check thresholds
  if (wordCount < thresholds.minWordCount) {
    warnings.push(`Answer should be at least ${thresholds.minWordCount} words (currently ${wordCount})`);
  }
  
  if (sentenceCount < thresholds.minSentenceCount) {
    warnings.push(`Answer should have at least ${thresholds.minSentenceCount} complete sentences (currently ${sentenceCount})`);
  }
  
  if (uniqueWordCount < thresholds.minUniqueWords) {
    warnings.push(`Answer needs more variety - use at least ${thresholds.minUniqueWords} different words (currently ${uniqueWordCount})`);
  }
  
  if (repetitionScore > 0.3) {
    warnings.push('Answer contains too much repetition');
  }
  
  // Calculate if valid
  const isValid = 
    wordCount >= thresholds.minWordCount &&
    sentenceCount >= thresholds.minSentenceCount &&
    uniqueWordCount >= thresholds.minUniqueWords &&
    spamWarnings.length === 0 &&
    repetitionScore <= 0.3;
  
  return {
    wordCount,
    sentenceCount,
    uniqueWordCount,
    isValid,
    warnings,
    metrics: {
      avgWordLength: text.length / Math.max(wordCount, 1),
      hasMinimumContent: wordCount >= 30, // Absolute minimum
      hasStructure: sentenceCount >= 2,
      repetitionScore
    }
  };
}

// Helper to determine if we should block submission
export function shouldBlockSubmission(
  validation: ValidationResult,
  allowOverride: boolean = false
): boolean {
  // Option C: Middle Ground - Consistent blocking logic for extreme cases
  
  // Never block if user is overriding after warning
  if (allowOverride) return false;
  
  // Block for ALL questions if answer is extremely poor quality
  // (Under 20 words OR high spam patterns)
  if (validation.wordCount < 20 || 
      validation.metrics.repetitionScore > 0.5 ||
      validation.warnings.some(w => 
        w.includes('Lorem Ipsum') || 
        w.includes('keyboard mashing') ||
        w.includes('Repeated phrase detected')
      )) {
    return true;
  }
  
  return false;
}

// Helper to get appropriate warning message
export function getValidationMessage(
  validation: ValidationResult
): { type: 'error' | 'warning' | 'info', message: string } | null {
  if (validation.isValid) return null;
  
  // Option C: Consistent gentle warnings for all questions
  // More serious tone only for extreme cases that would be blocked
  const isExtreme = validation.wordCount < 20 || 
                   validation.metrics.repetitionScore > 0.5 ||
                   validation.warnings.some(w => 
                     w.includes('Lorem Ipsum') || 
                     w.includes('keyboard mashing') ||
                     w.includes('Repeated phrase detected')
                   );
  
  if (isExtreme) {
    return {
      type: 'error',
      message: 'Your answer is too brief or contains repetitive content. Please provide a meaningful response.'
    };
  }
  
  // Standard gentle warning for all regular validation failures
  return {
    type: 'warning',
    message: 'Your answer could benefit from more detail. Include specific examples using the STAR method (Situation, Task, Action, Result).'
  };
}