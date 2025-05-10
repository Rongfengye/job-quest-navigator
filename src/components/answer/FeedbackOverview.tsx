
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
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

interface FeedbackItem {
  pros: string[];
  cons: string[];
  score: number;
  suggestions: string;
  overall: string;
}

interface FeedbackOverviewProps {
  feedback: any;
  questions: string[];
  responses?: string[]; // Made optional for backward compatibility
}

const FeedbackOverview: React.FC<FeedbackOverviewProps> = ({ feedback, questions, responses = [] }) => {
  const [expandedResponses, setExpandedResponses] = useState<Record<string, boolean>>({});

  // Handle case when feedback is not properly formatted
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

  // Convert feedback to array if it's not already
  const feedbackArray = Array.isArray(feedback) ? feedback : [feedback];

  // Process feedback items, ensuring they're properly formatted
  const processedFeedback = feedbackArray.map((item, index) => {
    // If the item is a string (just an answer) or not properly structured as a feedback item
    if (typeof item === 'string' || !item || typeof item !== 'object' || !('score' in item)) {
      // Return a basic feedback item
      return {
        pros: ['Your answer has been recorded'],
        cons: ['Detailed feedback is still being processed'],
        score: 50, // Default score
        suggestions: 'Please check back later for detailed feedback.',
        overall: typeof item === 'string' ? item : 'Answer recorded. Awaiting detailed feedback.',
      };
    }
    return item as FeedbackItem;
  });

  const averageScore = processedFeedback.length > 0 
    ? Math.round(processedFeedback.reduce((sum, item) => sum + (item.score || 0), 0) / processedFeedback.length)
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const toggleResponseExpand = (index: number) => {
    setExpandedResponses(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Function to truncate text and add ellipsis
  const truncateText = (text: string, maxLength: number = 150) => {
    if (text && text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Interview Feedback</h2>
        <Badge className={`${getScoreColor(averageScore)} text-white px-3 py-1`}>
          Overall Score: {averageScore}/100
        </Badge>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {processedFeedback.map((item, index) => (
          <AccordionItem key={index} value={`question-${index}`}>
            <AccordionTrigger className="py-4 hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex flex-col items-start text-left">
                  <span className="font-medium">Question {index + 1}</span>
                  <span className="text-sm text-gray-600 truncate max-w-[500px]">
                    {questions[index] || 'Question not available'}
                  </span>
                </div>
                <Badge className={`${getScoreColor(item.score || 0)} text-white ml-4`}>
                  Score: {item.score || 0}/100
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <Card className="border-0 shadow-none">
                <CardContent className="p-2">
                  <div className="space-y-4">
                    {/* Display full question */}
                    <div className="bg-gray-50 p-3 rounded-md">
                      <h4 className="font-semibold text-gray-800">Question:</h4>
                      <p className="mt-1 text-gray-700">{questions[index] || 'Question not available'}</p>
                    </div>

                    {/* Display response with collapsible functionality */}
                    {responses && responses[index] && (
                      <div className="bg-blue-50 p-3 rounded-md">
                        <h4 className="font-semibold text-blue-800">Your Response:</h4>
                        <Collapsible
                          open={expandedResponses[index]}
                          onOpenChange={() => toggleResponseExpand(index)}
                          className="mt-1"
                        >
                          <div className="text-gray-700">
                            {!expandedResponses[index] ? (
                              <p>{truncateText(responses[index], 150)}</p>
                            ) : (
                              <p>{responses[index]}</p>
                            )}
                          </div>
                          
                          {responses[index] && responses[index].length > 150 && (
                            <CollapsibleTrigger asChild>
                              <button className="flex items-center text-sm text-blue-600 hover:text-blue-800 mt-1">
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

                    <div>
                      <h4 className="font-semibold text-green-700 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" /> Strengths
                      </h4>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        {Array.isArray(item.pros) ? item.pros.map((pro, idx) => (
                          <li key={idx} className="text-green-800">{pro}</li>
                        )) : (
                          <li className="text-green-800">No strengths data available</li>
                        )}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-red-700 flex items-center gap-2">
                        <XCircle className="h-4 w-4" /> Areas for Improvement
                      </h4>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        {Array.isArray(item.cons) ? item.cons.map((con, idx) => (
                          <li key={idx} className="text-red-800">{con}</li>
                        )) : (
                          <li className="text-red-800">No improvement data available</li>
                        )}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold">Suggestions</h4>
                      <p className="mt-1 text-gray-700">{item.suggestions || 'No suggestions available'}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold">Overall Assessment</h4>
                      <p className="mt-1 text-gray-700">{item.overall || 'No overall assessment available'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        ))}
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
