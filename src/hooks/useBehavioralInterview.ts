import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAudioPlayback } from './useAudioPlayback';

interface BehavioralQuestionData {
  question: string;
  explanation?: string;
  questionIndex: number;
  storylineId?: string;
}

interface LocationState {
  formData?: {
    jobTitle: string;
    jobDescription: string;
    companyName: string;
    companyDescription: string;
  };
}

export const useBehavioralInterview = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<BehavioralQuestionData | null>(null);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [behavioralId, setBehavioralId] = useState<string | null>(null);
  const [audioCache, setAudioCache] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  
  const { isPlaying, isMuted, playAudio, toggleMute } = useAudioPlayback();

  const setInitialQuestions = async (generatedData: any) => {
    if (!generatedData) return;
    
    try {
      // Hardcoded test question
      const testQuestion = "Tell me about a time when you had to manage a group of children in a dynamic environment, ensuring their safety and engagement. How did you handle any challenges that arose, and what was the outcome?";
      
      // Create array of 5 identical questions for testing
      const allQuestions = Array(5).fill({
        question: testQuestion,
        explanation: 'Test question for audio length testing',
      });

      const firstQuestion: BehavioralQuestionData = {
        question: testQuestion,
        explanation: 'Test question for audio length testing',
        questionIndex: 0
      };
      
      const questionTexts = allQuestions.map((q: any) => q.question);
      setQuestions(questionTexts);
      setCurrentQuestion(firstQuestion);
      setIsLoading(false);
      
      await playQuestionAudio(firstQuestion.question);
      
      console.log('Set initial test questions:', questionTexts);
    } catch (error) {
      console.error('Error setting initial questions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process the test questions. Please try again.",
      });
    }
  };

  const playQuestionAudio = useCallback(async (question: string) => {
    if (isMuted || !question) return;

    try {
      console.log('Generating audio for question:', question.substring(0, 100) + '...');
      
      const { data, error } = await supabase.functions.invoke('storyline-text-to-speech', {
        body: { text: question }
      });

      if (error) {
        console.error('Error invoking text-to-speech function:', error);
        throw error;
      }

      if (!data || !data.audioContent) {
        throw new Error('No audio content received from text-to-speech function');
      }

      console.log('Received audio content length:', data.audioContent.length);
      await playAudio(data.audioContent, data.mimeType);
      
    } catch (error) {
      console.error('Error in playQuestionAudio:', error);
      toast({
        variant: "destructive",
        title: "Audio Error",
        description: "Failed to generate or play audio. You can continue with text.",
      });
    }
  }, [isMuted, playAudio, toast]);

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
      // Use the same test question for all slots
      const testQuestion = "Tell me about a time when you had to manage a group of children in a dynamic environment, ensuring their safety and engagement. How did you handle any challenges that arose, and what was the outcome?";
      
      // Comment out original question generation code
      /*
      if (currentQuestionIndex === 0 && !behavioralId) {
        const { data: behavioralData, error: behavioralError } = await supabase
          .from('storyline_behaviorals')
          .insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            job_title: formData.jobTitle,
            job_description: formData.jobDescription,
            company_name: formData.companyName,
            company_description: formData.companyDescription,
            resume_path: resumeText ? 'resume.txt' : '',
            cover_letter_path: coverLetterText ? 'cover_letter.txt' : null,
            additional_documents_path: additionalDocumentsText ? 'additional_docs.txt' : null
          })
          .select('id')
          .single();
          
        if (behavioralError) {
          throw new Error(`Error creating behavioral interview: ${behavioralError.message}`);
        }
        
        setBehavioralId(behavioralData.id);
      }
      */
      
      const questionData: BehavioralQuestionData = {
        question: testQuestion,
        explanation: 'Test question for audio length testing',
        questionIndex: currentQuestionIndex,
        storylineId: behavioralId || undefined
      };
      
      setCurrentQuestion(questionData);
      
      await playQuestionAudio(testQuestion);
      
      if (behavioralId) {
        const updatedQuestions = [...questions];
        updatedQuestions[currentQuestionIndex] = testQuestion;
        
        /*
        await supabase
          .from('storyline_behaviorals')
          .update({
            questions: updatedQuestions
          })
          .eq('id', behavioralId);
        */
      }
      
      return { question: testQuestion };
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
      
      if (questions.length < 5 || answersToUse.length < 5) {
        console.error('Not enough questions or answers to generate feedback', {
          questionsCount: questions.length,
          answersCount: answersToUse.length
        });
        throw new Error(`Not enough questions or answers to generate feedback. 
          Questions: ${questions.length}, Answers: ${answersToUse.length}`);
      }
      
      if (!answersToUse.every(a => a?.trim())) {
        console.error('One or more answers are empty', answersToUse);
        throw new Error('Cannot generate feedback: one or more answers are empty');
      }
      
      const jobData = locationState?.formData || {
        jobTitle: '',
        jobDescription: '',
        companyName: '',
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

      navigate('/behavioral', { state: { interviewComplete: true } });
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
      const updatedQuestions = [...questions];
      const updatedAnswers = [...answers];
      
      updatedQuestions[currentQuestionIndex] = currentQuestion.question;
      updatedAnswers[currentQuestionIndex] = answer;
      
      setQuestions(updatedQuestions);
      setAnswers(updatedAnswers);
      
      if (behavioralId) {
        await supabase
          .from('storyline_behaviorals')
          .update({
            responses: updatedAnswers
          })
          .eq('id', behavioralId);
      }
      
      if (currentQuestionIndex >= 4) {
        setInterviewComplete(true);
        console.log('Final answer submitted, all answers:', updatedAnswers);
        
        setTimeout(async () => {
          try {
            if (updatedAnswers.length === 5 && updatedAnswers.every(a => a)) {
              console.log('Generating feedback with updated answers array:', updatedAnswers);
              await generateFeedback(updatedAnswers);
            } else {
              console.error('Still missing complete answers after delay', updatedAnswers);
              toast({
                variant: "destructive",
                title: "Error",
                description: "Could not generate feedback: missing answers",
              });
            }
          } catch (feedbackError) {
            console.error('Error in delayed feedback generation:', feedbackError);
          }
        }, 1000);
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
    behavioralId,
    isMuted,
    isPlaying,
    toggleMute,
    playQuestionAudio,
  };
};
