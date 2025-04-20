
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BehavioralQuestionData {
  question: string;
  explanation: string;
  keyPoints: string[];
  questionIndex: number;
}

export const useBehavioralInterview = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<BehavioralQuestionData | null>(null);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Generate the first or next question
  const generateQuestion = async (
    formData: {
      jobTitle: string;
      jobDescription: string;
      companyName: string;
      companyDescription: string;
    },
    resumeText: string,
    coverLetterText: string = '',
    additionalDocumentsText: string = ''
  ) => {
    setIsLoading(true);
    
    try {
      const requestBody = {
        jobTitle: formData.jobTitle,
        jobDescription: formData.jobDescription,
        companyName: formData.companyName,
        companyDescription: formData.companyDescription,
        resumeText,
        coverLetterText,
        additionalDocumentsText,
        previousQuestions: questions,
        previousAnswers: answers,
        questionIndex: currentQuestionIndex,
      };
      
      console.log(`Generating question at index: ${currentQuestionIndex}`);
      
      const { data, error } = await supabase.functions.invoke('create-behavioral-interview', {
        body: requestBody,
      });
      
      if (error) {
        throw new Error(`Error generating question: ${error.message}`);
      }
      
      if (!data || !data.question) {
        throw new Error('No question was generated');
      }
      
      console.log('Question generated:', data.question);
      setCurrentQuestion(data);
      
      return data;
    } catch (error) {
      console.error('Error in generateQuestion:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate interview question",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Submit an answer to the current question
  const submitAnswer = (answer: string) => {
    if (!currentQuestion) return;
    
    // Save the question and answer
    const updatedQuestions = [...questions];
    const updatedAnswers = [...answers];
    
    updatedQuestions[currentQuestionIndex] = currentQuestion.question;
    updatedAnswers[currentQuestionIndex] = answer;
    
    setQuestions(updatedQuestions);
    setAnswers(updatedAnswers);
    
    // Move to the next question or complete the interview
    if (currentQuestionIndex >= 4) {
      setInterviewComplete(true);
      toast({
        title: "Interview Complete",
        description: "You have completed all 5 behavioral interview questions!",
      });
      // Here you would typically persist the results or navigate to a summary page
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  // Reset the interview state
  const resetInterview = () => {
    setCurrentQuestionIndex(0);
    setQuestions([]);
    setAnswers([]);
    setCurrentQuestion(null);
    setInterviewComplete(false);
  };

  return {
    isLoading,
    currentQuestionIndex,
    questions,
    answers,
    currentQuestion,
    interviewComplete,
    generateQuestion,
    submitAnswer,
    resetInterview
  };
};
