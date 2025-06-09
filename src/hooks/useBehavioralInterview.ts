import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BehavioralQuestionData {
  question: string;
  explanation?: string;
  questionIndex: number;
  storylineId?: string;
  audio?: string | null;
}

interface LocationState {
  formData?: {
    jobTitle: string;
    jobDescription: string;
    companyName: string;
    companyDescription: string;
  };
  resumeText?: string;
  resumePath?: string;
  coverLetterText?: string;
  coverLetterPath?: string;
  additionalDocumentsText?: string;
  additionalDocumentsPath?: string;
}

export const useBehavioralInterview = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isTransitionLoading, setIsTransitionLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<BehavioralQuestionData | null>(null);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [behavioralId, setBehavioralId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;

  // Debug logging for currentQuestion state changes
  const setCurrentQuestionWithLog = (value: BehavioralQuestionData | null) => {
    setCurrentQuestion(value);
    
    // If this is the first question being set, mark initial loading as complete
    if (value && isInitialLoading) {
      setIsInitialLoading(false);
    }
  };

  // Keep this for backward compatibility but it won't be used in the new flow
  const setInitialQuestions = async (generatedData: any) => {
    if (!generatedData) return;
    
    try {
      const technicalQuestions = generatedData.technicalQuestions || [];
      const behavioralQuestions = generatedData.behavioralQuestions || [];
      const allQuestions = [...technicalQuestions, ...behavioralQuestions].slice(0, 5);
      
      if (allQuestions.length === 0) {
        throw new Error('No questions found in the generated data');
      }
      
      const randomIndex = Math.floor(Math.random() * allQuestions.length);
      const randomQuestion = allQuestions[randomIndex];
      
      const formattedQuestion: BehavioralQuestionData = {
        question: randomQuestion.question,
        explanation: randomQuestion.explanation || '',
        questionIndex: 0
      };
      
      const questionTexts = allQuestions.map((q: any) => q.question);
      setQuestions(questionTexts);
      setCurrentQuestionWithLog(formattedQuestion);
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
    additionalDocumentsText: string = '',
    resumePath: string = '',
    coverLetterPath: string = '',
    additionalDocumentsPath: string = '',
    existingBehavioralId?: string
  ) => {
    setIsLoading(true);
    
    try {
      // If we have an existing behavioralId, use it
      if (existingBehavioralId) {
        setBehavioralId(existingBehavioralId);
      }
      
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
        generateAudio: true,
        voice: 'alloy',
        resumePath: resumePath || ''
      };
      
      console.log(`Generating question at index: ${currentQuestionIndex}`);
      console.log(`Using resume path: ${resumePath}`);
      
      const { data, error } = await supabase.functions.invoke('storyline-create-behavioral-interview', {
        body: requestBody,
      });
      
      if (error) {
        throw new Error(`Error generating question: ${error.message}`);
      }
      
      if (!data || !data.question) {
        throw new Error('No question was generated');
      }
      
      console.log('Question generated:', data.question);
      console.log('Audio data received:', data.audio ? 'Yes' : 'No');
      
      const questionData: BehavioralQuestionData = {
        ...data,
        storylineId: behavioralId || undefined
      };
      
      setCurrentQuestionWithLog(questionData);
      
      // Update questions array immediately when question is generated
      const existingQuestions = [...questions];
      existingQuestions[currentQuestionIndex] = data.question;
      setQuestions(existingQuestions);
      
      // if (behavioralId) {
      // Only update the specific question at the current index
      const BehavioralIdToUse = existingBehavioralId || behavioralId;
      const { data: currentData } = await supabase
        .from('storyline_behaviorals')
        .select('questions')
        .eq('id', BehavioralIdToUse)
        .single();
        
      if (currentData) {
        console.log('Current question index:', currentQuestionIndex);
        console.log('Current questions in DB:', currentData.questions);
        const updatedQuestions = Array.isArray(currentData.questions) ? currentData.questions : [];
        updatedQuestions[currentQuestionIndex] = data.question;
        console.log('Updated questions array:', updatedQuestions);
        
        const { error: updateError } = await supabase
          .from('storyline_behaviorals')
          .update({
            questions: updatedQuestions
          })
          .eq('id', BehavioralIdToUse);
          
        if (updateError) {
          console.error('Error updating questions:', updateError);
        } else {
          console.log('Successfully updated questions in database');
        }
      }
      // }
      
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

  const generateFeedback = async (providedAnswers?: string[]) => {
    setIsLoading(true);
    try {
      const answersToUse = providedAnswers || answers;
      
      if (!answersToUse.every(a => a?.trim())) {
        console.error('One or more answers are empty', answersToUse);
        throw new Error('Cannot generate feedback: one or more answers are empty');
      }
      
      const jobData = locationState?.formData || {
        jobTitle: '',
        jobDescription: '',
        companyName: '',
        companyDescription: '',
      };

      console.log('Generating feedback for questions:', questions);
      console.log('Generating feedback for answers:', answersToUse);

      const { data: response, error } = await supabase.functions.invoke('storyline-create-behavioral-interview', {
        body: {
          generateFeedback: true,
          questions,
          answers: answersToUse,
          jobTitle: jobData.jobTitle,
          jobDescription: jobData.jobDescription,
          companyName: jobData.companyName,
          companyDescription: jobData.companyDescription,
          resumeText: locationState?.resumeText || '',
        },
      });

      if (error) {
        throw new Error(`Error generating feedback: ${error.message}`);
      }

      if (!response || !response.feedback) {
        throw new Error('No feedback was generated');
      }

      console.log('Feedback received:', response.feedback);

      if (behavioralId) {
        // Save both feedback and ensure questions are also saved
        const updateResult = await supabase
          .from('storyline_behaviorals')
          .update({
            feedback: response.feedback,
            questions: questions,  // Ensure questions are saved with feedback
            responses: answersToUse
          })
          .eq('id', behavioralId);
          
        if (updateResult.error) {
          console.error('Error saving feedback to database:', updateResult.error);
        } else {
          console.log('Successfully saved feedback and questions to database');
        }
      }

      toast({
        title: "Feedback Generated",
        description: "Your interview responses have been evaluated.",
      });

      navigate('/behavioral-feedback', { 
        state: { 
          interviewComplete: true,
          behavioralId,
          feedback: response.feedback,
          questions
        }
      });
      
      return response.feedback;
    } catch (error) {
      console.error('Error in generateFeedback:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate feedback",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async (answer: string) => {
    if (!currentQuestion) return;
    
    try {
      const updatedAnswers = [...answers];
      
      // Ensure the current question is saved in the answers array
      updatedAnswers[currentQuestionIndex] = answer;
      
      setAnswers(updatedAnswers);
      
      if (behavioralId) {
        // Only update the responses array
        const { data: currentData } = await supabase
          .from('storyline_behaviorals')
          .select('responses')
          .eq('id', behavioralId)
          .single();
          
        if (currentData) {
          const existingResponses = Array.isArray(currentData.responses) ? currentData.responses : [];
          existingResponses[currentQuestionIndex] = answer;
          
          await supabase
            .from('storyline_behaviorals')
            .update({
              responses: existingResponses
            })
            .eq('id', behavioralId);
        }
      }
      
      if (currentQuestionIndex >= 4) {
        setInterviewComplete(true);
        console.log('Final answer submitted, all answers:', {
          answers: updatedAnswers
        });
      } else {
        setIsTransitionLoading(true);
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
    setCurrentQuestionWithLog(null);
    setInterviewComplete(false);
    setBehavioralId(null);
    setIsInitialLoading(true);
    setIsTransitionLoading(false);
  };

  return {
    isLoading,
    isInitialLoading,
    isTransitionLoading,
    currentQuestionIndex,
    questions,
    answers,
    currentQuestion,
    interviewComplete,
    generateQuestion,
    submitAnswer,
    resetInterview,
    setInitialQuestions,
    generateFeedback,
    behavioralId,
    setIsTransitionLoading,
    setCurrentQuestion: setCurrentQuestionWithLog,
    setBehavioralId
  };
};
