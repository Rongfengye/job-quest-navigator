import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Question {
  question: string;
  questionIndex: number;
  audio?: string | null;
}

export const useBehavioralInterview = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isTransitionLoading, setIsTransitionLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [behavioralId, setBehavioralId] = useState<string | null>(null);
  const [interviewComplete, setInterviewComplete] = useState(false);

  const loadExistingInterview = useCallback(async (id: string) => {
    console.log('Loading existing interview with ID:', id);
    setIsInitialLoading(true);
    
    try {
      const { data: behavioral, error } = await supabase
        .from('storyline_behaviorals')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error loading behavioral interview:', error);
        throw error;
      }

      if (!behavioral) {
        throw new Error('Interview not found');
      }

      // Set behavioral ID
      setBehavioralId(id);

      // Parse and set questions/answers safely
      const questionsArray = Array.isArray(behavioral.questions) 
        ? behavioral.questions.map(q => String(q))
        : [];
      const answersArray = Array.isArray(behavioral.responses) 
        ? behavioral.responses.map(r => String(r))
        : [];

      setQuestions(questionsArray);
      setAnswers(answersArray);

      // Determine current question index
      const nextIndex = answersArray.length;
      setCurrentQuestionIndex(nextIndex);

      // Set current question if available
      if (nextIndex < questionsArray.length) {
        const currentQuestionText = String(questionsArray[nextIndex]);
        setCurrentQuestion({
          question: currentQuestionText,
          questionIndex: nextIndex,
          audio: null
        });
      } else if (nextIndex >= 5) {
        setInterviewComplete(true);
      }

      console.log('Interview loaded successfully:', {
        questionsCount: questionsArray.length,
        answersCount: answersArray.length,
        nextIndex
      });

      return {
        formData: {
          jobTitle: behavioral.job_title || '',
          jobDescription: behavioral.job_description || '',
          companyName: behavioral.company_name || '',
          companyDescription: behavioral.company_description || ''
        }
      };
    } catch (error) {
      console.error('Failed to load existing interview:', error);
      throw error;
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  const generateQuestion = useCallback(async (
    formData: any, 
    resumeText: string, 
    coverLetterText: string = '',
    additionalDocumentsText: string = '',
    resumePath: string = '',
    coverLetterPath: string = '',
    additionalDocumentsPath: string = ''
  ) => {
    if (!behavioralId) {
      throw new Error('No behavioral ID set');
    }

    setIsLoading(true);
    setIsTransitionLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('storyline-create-behavioral-interview', {
        body: {
          action: 'generate_question',
          behavioral_id: behavioralId,
          job_title: formData.jobTitle,
          job_description: formData.jobDescription,
          company_name: formData.companyName,
          company_description: formData.companyDescription,
          resume_text: resumeText,
          cover_letter_text: coverLetterText,
          additional_documents_text: additionalDocumentsText,
          resume_path: resumePath,
          cover_letter_path: coverLetterPath,
          additional_documents_path: additionalDocumentsPath,
          current_questions: questions,
          current_answers: answers
        }
      });

      if (error) throw error;

      if (data?.question) {
        const newQuestion: Question = {
          question: data.question,
          questionIndex: currentQuestionIndex,
          audio: data.audio || null
        };
        
        setCurrentQuestion(newQuestion);
        
        const updatedQuestions = [...questions];
        updatedQuestions[currentQuestionIndex] = data.question;
        setQuestions(updatedQuestions);
        
        console.log('Question generated successfully for index:', currentQuestionIndex);
      }
    } catch (error) {
      console.error('Error generating question:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [behavioralId, questions, answers, currentQuestionIndex]);

  const submitAnswer = useCallback(async (answer: string) => {
    if (!behavioralId) {
      throw new Error('No behavioral ID set');
    }

    console.log('Submitting answer for question index:', currentQuestionIndex);
    
    try {
      const updatedAnswers = [...answers];
      updatedAnswers[currentQuestionIndex] = answer;
      setAnswers(updatedAnswers);

      // Update the database
      const { error } = await supabase
        .from('storyline_behaviorals')
        .update({
          responses: updatedAnswers
        })
        .eq('id', behavioralId);

      if (error) throw error;

      // Move to next question
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);

      if (nextIndex >= 5) {
        setInterviewComplete(true);
        setCurrentQuestion(null);
      }

      console.log('Answer submitted successfully, moved to index:', nextIndex);
    } catch (error) {
      console.error('Error submitting answer:', error);
      throw error;
    }
  }, [behavioralId, currentQuestionIndex, answers]);

  const generateFeedback = useCallback(async () => {
    if (!behavioralId) {
      throw new Error('No behavioral ID set');
    }

    console.log('Generating feedback for behavioral interview:', behavioralId);
    
    try {
      const { data, error } = await supabase.functions.invoke('storyline-create-behavioral-interview', {
        body: {
          action: 'generate_feedback',
          behavioral_id: behavioralId,
          questions: questions,
          answers: answers
        }
      });

      if (error) throw error;

      console.log('Feedback generated successfully');
      return data;
    } catch (error) {
      console.error('Error generating feedback:', error);
      throw error;
    }
  }, [behavioralId, questions, answers]);

  return {
    isLoading,
    isInitialLoading,
    isTransitionLoading,
    currentQuestionIndex,
    currentQuestion,
    generateQuestion,
    submitAnswer,
    questions,
    answers,
    generateFeedback,
    interviewComplete,
    setIsTransitionLoading,
    setCurrentQuestion,
    setBehavioralId,
    loadExistingInterview
  };
};
