
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import EnhancedFeedbackDisplay from '@/components/feedback/EnhancedFeedbackDisplay';
import { FeedbackData, isEnhancedFeedback } from '@/types/enhancedFeedback';

interface LegacyFeedbackItem {
  pros: string[];
  cons: string[];
  score: number;
  suggestions: string;
  overall: string;
}

interface FeedbackOverviewProps {
  feedback: any;
  questions: string[];
  responses?: string[];
}

const FeedbackOverview: React.FC<FeedbackOverviewProps> = ({ feedback, questions, responses = [] }) => {
  const [expandedResponses, setExpandedResponses] = useState<Record<string, boolean>>({});

  if (!feedback || !Array.isArray(questions) || questions.length === 0) {
    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold text-red-600">
          No feedback data available
        </h3>
        <p>Please complete the interview to receive feedback.</p>
      </div>
    );
  }

  const feedbackArray = Array.isArray(feedback) ? feedback : [feedback];

  const processedFeedback = feedbackArray.map((item, index) => {
    if (typeof item === 'string' || !item || typeof item !== 'object' || !('score' in item)) {
      return {
        pros: ['Your answer has been recorded'],
        cons: ['Detailed feedback is still being processed'],
        score: 50,
        suggestions: 'Please check back later for detailed feedback.',
        overall: typeof item === 'string' ? item : 'Answer recorded. Awaiting detailed feedback.',
      } as LegacyFeedbackItem;
    }
    return item as FeedbackData;
  });

  const averageScore = processedFeedback.length > 0 
    ? Math.round(processedFeedback.reduce((sum, item) => sum + (item.score || 0), 0) / processedFeedback.length)
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (score >= 60) return 'bg-yellow-50 text-yellow-700 border-yellow-100';
    return 'bg-orange-50 text-orange-700 border-orange-100';
  };

  const toggleResponseExpand = (index: number) => {
    setExpandedResponses(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text && text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  };

  // Helper function to get question text with fallback
  const getQuestionText = (index: number) => {
    return questions[index] || `Question ${index + 1}`;
  };

  // Ensure we show feedback for all 5 questions, even if some questions are missing
  const displayCount = Math.max(5, questions.length, processedFeedback.length);

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Interview Feedback</h2>
        <Badge className={`${getScoreColor(averageScore)} px-3 py-1`}>
          Overall Score: {averageScore}/100
        </Badge>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {Array.from({ length: displayCount }, (_, index) => {
          const feedbackItem = processedFeedback[index];
          const questionText = getQuestionText(index);
          const responseText = responses && responses[index];
          
          return (
            <AccordionItem key={index} value={`question-${index}`}>
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium">Question {index + 1}</span>
                    <span className="text-sm text-gray-600 truncate max-w-[500px]">
                      {questionText === `Question ${index + 1}` ? 'Question not available' : questionText}
                    </span>
                  </div>
                  <Badge className={`${getScoreColor(feedbackItem?.score || 0)} ml-4`}>
                    {feedbackItem?.score || 0}/100
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-4">
                <div className="space-y-4">
                      {/* Question text removed - already shown in accordion header */}

                      {responseText && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-sm text-gray-700 mb-2">Your Response</h4>
                          <Collapsible
                            open={expandedResponses[index]}
                            onOpenChange={() => toggleResponseExpand(index)}
                            className="mt-1"
                          >
                            <div className="text-gray-700">
                              {!expandedResponses[index] ? (
                                <p>{truncateText(responseText, 150)}</p>
                              ) : (
                                <p>{responseText}</p>
                              )}
                            </div>
                            
                            {responseText.length > 150 && (
                              <CollapsibleTrigger asChild>
                                <button className="flex items-center text-sm text-gray-500 hover:text-gray-700 mt-1">
                                  {expandedResponses[index] ? (
                                    <>Show less <ChevronUp className="h-4 w-4 ml-1" /></>
                                  ) : (
                                    <>Show more <ChevronDown className="h-4 w-4 ml-1" /></>
                                  )}
                                </button>
                              </CollapsibleTrigger>
                            )}
                            
                            <CollapsibleContent className="overflow-hidden" />
                          </Collapsible>
                        </div>
                      )}

                      {feedbackItem && (
                        <div className="bg-gray-50 rounded-xl p-6">
                          <EnhancedFeedbackDisplay feedback={feedbackItem} questionIndex={index} />
                        </div>
                      )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {processedFeedback.length === 0 && (
        <div className="p-4 text-center">
          <p className="text-gray-500">No feedback data available.</p>
        </div>
      )}
    </div>
  );
};

export default FeedbackOverview;
