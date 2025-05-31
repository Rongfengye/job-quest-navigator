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

  // Debug logging for isLoading state changes
  const setIsLoadingWithLog = (value: boolean) => {
    console.log('MAY 31 DEBUG - useBehavioralInterview isLoading changing from', isLoading, 'to', value);
    setIsLoading(value);
  };

  // Debug logging for currentQuestion state changes
  const setCurrentQuestionWithLog = (value: BehavioralQuestionData | null) => {
    console.log('MAY 31 DEBUG - useBehavioralInterview currentQuestion changing:', {
      from: currentQuestion ? 'Has question' : 'No question',
      to: value ? 'Has question' : 'No question',
      newQuestionText: value?.question ? value.question.substring(0, 50) + '...' : 'No question'
    });
    setCurrentQuestion(value);
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
      setIsLoadingWithLog(false);
      
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
    additionalDocumentsPath: string = ''
  ) => {
    console.log('MAY 31 DEBUG - generateQuestion called for question index:', currentQuestionIndex);
    setIsLoadingWithLog(true);
    
    try {
      if (currentQuestionIndex === 0 && !behavioralId) {
        console.log('MAY 31 DEBUG - Creating new behavioral interview record');
        const { data: behavioralData, error: behavioralError } = await supabase
          .from('storyline_behaviorals')
          .insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            job_title: formData.jobTitle,
            job_description: formData.jobDescription,
            company_name: formData.companyName,
            company_description: formData.companyDescription,
            resume_path: resumePath || '',
            cover_letter_path: coverLetterPath || null,
            additional_documents_path: additionalDocumentsPath || null
          })
          .select('id')
          .single();
          
        if (behavioralError) {
          throw new Error(`Error creating behavioral interview: ${behavioralError.message}`);
        }
        
        console.log("Created behavioral interview with ID:", behavioralData.id);
        console.log("Resume path stored:", resumePath);
        
        setBehavioralId(behavioralData.id);
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
        generateAudio: true, // Request audio generation
        voice: 'alloy',      // Default voice
        resumePath: resumePath || ''
      };
      
      console.log(`Generating question at index: ${currentQuestionIndex}`);
      console.log(`Using resume path: ${resumePath}`);
      console.log('MAY 31 DEBUG - About to call edge function storyline-create-behavioral-interview');
      
      const { data, error } = await supabase.functions.invoke('storyline-create-behavioral-interview', {
        body: requestBody,
      });
      
      console.log('MAY 31 DEBUG - Edge function response received:', {
        hasData: !!data,
        hasError: !!error,
        hasQuestion: data?.question ? true : false
      });
      
      if (error) {
        throw new Error(`Error generating question: ${error.message}`);
      }
      
      if (!data || !data.question) {
        throw new Error('No question was generated');
      }
      
      console.log('Question generated:', data.question);
      console.log('Audio data received:', data.audio ? 'Yes' : 'No');
      console.log('MAY 31 DEBUG - Successfully received question from edge function, setting currentQuestion');
      
      const questionData: BehavioralQuestionData = {
        ...data,
        storylineId: behavioralId || undefined
      };
      
      setCurrentQuestionWithLog(questionData);
      
      if (behavioralId) {
        const updatedQuestions = [...questions];
        updatedQuestions[currentQuestionIndex] = data.question;
        
        await supabase
          .from('storyline_behaviorals')
          .update({
            questions: updatedQuestions
          })
          .eq('id', behavioralId);
      }
      
      console.log('MAY 31 DEBUG - generateQuestion completed successfully');
      return data;
    } catch (error) {
      console.error('Error in generateQuestion:', error);
      console.log('MAY 31 DEBUG - generateQuestion failed with error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate interview question",
      });
      return null;
    } finally {
      console.log('MAY 31 DEBUG - generateQuestion finally block, setting isLoading to false');
      setIsLoadingWithLog(false);
    }
  };

  const generateFeedback = async (providedAnswers?: string[]) => {
    setIsLoadingWithLog(true);
    try {
      const answersToUse = providedAnswers || answers;
      
      // Fix: Only check for answers.length when generating feedback
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
        const updateResult = await supabase
          .from('storyline_behaviorals')
          .update({
            feedback: response.feedback
          })
          .eq('id', behavioralId);
          
        if (updateResult.error) {
          console.error('Error saving feedback to database:', updateResult.error);
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
      setIsLoadingWithLog(false);
    }
  };

  const submitAnswer = async (answer: string) => {
    if (!currentQuestion) return;
    
    console.log('MAY 31 DEBUG - submitAnswer called for question index:', currentQuestionIndex);
    
    try {
      const updatedQuestions = [...questions];
      const updatedAnswers = [...answers];
      
      updatedQuestions[currentQuestionIndex] = currentQuestion.question;
      updatedAnswers[currentQuestionIndex] = answer;
      
      setQuestions(updatedQuestions);
      setAnswers(updatedAnswers);
      
      console.log('MAY 31 DEBUG - Answer submitted, updated arrays:', {
        questionsLength: updatedQuestions.length,
        answersLength: updatedAnswers.length,
        currentIndex: currentQuestionIndex
      });
      
      if (behavioralId) {
        await supabase
          .from('storyline_behaviorals')
          .update({
            responses: updatedAnswers
          })
          .eq('id', behavioralId);
      }
      
      // Fix: Check if we've completed all 5 questions (0-based index equals 4)
      if (currentQuestionIndex >= 4) {
        console.log('MAY 31 DEBUG - Final answer submitted, setting interview complete');
        setInterviewComplete(true);
        console.log('Final answer submitted, all answers:', updatedAnswers);
        
        // Don't try to generate any more questions, just set up for feedback generation
      } else {
        console.log('MAY 31 DEBUG - Moving to next question index:', currentQuestionIndex + 1);
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
    setInitialQuestions,
    generateFeedback,
    behavioralId
  };
};
