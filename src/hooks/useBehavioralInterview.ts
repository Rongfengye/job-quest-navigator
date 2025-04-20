import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BehavioralQuestionData {
  question: string;
  explanation: string;
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

  const setInitialQuestions = async (generatedData: any) => {
    if (!generatedData) return;
    
    try {
      const technicalQuestions = generatedData.technicalQuestions || [];
      const behavioralQuestions = generatedData.behavioralQuestions || [];
      const allQuestions = [...technicalQuestions, ...behavioralQuestions].slice(0, 5);
      
      if (allQuestions.length === 0) {
        throw new Error('No questions found in the generated data');
      }
      
      const firstQuestion = allQuestions[0];
      const formattedQuestion: BehavioralQuestionData = {
        question: firstQuestion.question,
        explanation: firstQuestion.explanation || '',
        questionIndex: 0
      };
      
      const questionTexts = allQuestions.map((q: any) => q.question);
      setQuestions(questionTexts);
      setCurrentQuestion(formattedQuestion);
      setIsLoading(false);
      
      console.log('Set initial questions:', questionTexts);
    } catch (error) {
      console.error('Error setting initial questions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process the generated questions. Please try again.",
      });
    }
  };

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
      
      await supabase
        .from('storyline_behaviorals')
        .update({
          questions: questions.concat(data.question),
        })
        .eq('job_title', formData.jobTitle)
        .eq('job_description', formData.jobDescription);
      
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

  const submitAnswer = async (answer: string) => {
    if (!currentQuestion) return;
    
    try {
      const updatedQuestions = [...questions];
      const updatedAnswers = [...answers];
      
      updatedQuestions[currentQuestionIndex] = currentQuestion.question;
      updatedAnswers[currentQuestionIndex] = answer;
      
      setQuestions(updatedQuestions);
      setAnswers(updatedAnswers);
      
      await supabase
        .from('storyline_behaviorals')
        .update({
          responses: updatedAnswers,
        })
        .eq('id', currentQuestion.storylineId);
      
      if (currentQuestionIndex >= 4) {
        setInterviewComplete(true);
        toast({
          title: "Interview Complete",
          description: "You have completed all 5 behavioral interview questions!",
        });
      } else {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save your answer. Please try again.",
      });
    }
  };

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
    resetInterview,
    setInitialQuestions
  };
};
