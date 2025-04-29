import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCache, setAudioCache] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;

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
      const firstQuestion = allQuestions[randomIndex];
      const formattedQuestion: BehavioralQuestionData = {
        question: firstQuestion.question,
        explanation: firstQuestion.explanation || '',
        questionIndex: 0
      };
      
      const questionTexts = allQuestions.map((q: any) => q.question);
      setQuestions(questionTexts);
      setCurrentQuestion(formattedQuestion);
      setIsLoading(false);
      
      await playQuestionAudio(formattedQuestion.question);
      
      console.log('Set initial questions:', questionTexts);
      console.log('Selected random first question at index:', randomIndex);
    } catch (error) {
      console.error('Error setting initial questions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process the generated questions. Please try again.",
      });
    }
  };

  const playQuestionAudio = useCallback(async (question: string) => {
    if (isMuted || !question) return;

    try {
      setIsPlaying(true);
      
      let audioContent = audioCache[question];
      
      if (!audioContent) {
        const { data, error } = await supabase.functions.invoke('storyline-text-to-speech', {
          body: { text: question }
        });

        if (error) throw error;
        audioContent = data.audioContent;
        
        setAudioCache(prev => ({
          ...prev,
          [question]: audioContent
        }));
      }

      const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
      await audio.play();
      
      audio.onended = () => {
        setIsPlaying(false);
      };
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to play audio. Please try again.",
      });
    }
  }, [isMuted, audioCache, toast]);

  const toggleMute = () => {
    setIsMuted(prev => !prev);
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
      
      console.log(`[DEBUG - useBehavioralInterview] Generating question at index: ${currentQuestionIndex}`);
      console.log('[DEBUG - useBehavioralInterview] Request body:', JSON.stringify(requestBody, null, 2));
      
      const { data, error } = await supabase.functions.invoke('storyline-create-behavioral-interview', {
        body: requestBody,
      });
      
      console.log('[DEBUG - useBehavioralInterview] Response received:', JSON.stringify(data));
      if (error) {
        console.error('[ERROR - useBehavioralInterview] Function error:', error);
        throw new Error(`Error generating question: ${error.message}`);
      }
      
      if (!data || !data.question) {
        console.error('[ERROR - useBehavioralInterview] Invalid response format:', data);
        throw new Error('No question was generated');
      }
      
      console.log('[DEBUG - useBehavioralInterview] Question generated:', data.question);
      
      const questionData: BehavioralQuestionData = {
        ...data,
        storylineId: behavioralId || undefined
      };
      
      setCurrentQuestion(questionData);
      
      await playQuestionAudio(data.question);
      
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
      
      return data;
    } catch (error) {
      console.error('[ERROR - useBehavioralInterview] Error in generateQuestion:', error);
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

      console.log('[DEBUG - useBehavioralInterview] Generating feedback for questions:', questions);
      console.log('[DEBUG - useBehavioralInterview] Generating feedback for answers:', answersToUse);
      
      const requestBody = {
        generateFeedback: true,
        questions,
        answers: answersToUse,
        jobTitle: jobData.jobTitle,
        jobDescription: jobData.jobDescription,
        companyName: jobData.companyName,
      };
      
      console.log('[DEBUG - useBehavioralInterview] Feedback request body:', JSON.stringify(requestBody, null, 2));

      const { data: response, error } = await supabase.functions.invoke('storyline-create-behavioral-interview', {
        body: requestBody,
      });

      console.log('[DEBUG - useBehavioralInterview] Feedback response received:', JSON.stringify(response));
      if (error) {
        console.error('[ERROR - useBehavioralInterview] Function error:', error);
        throw new Error(`Error generating feedback: ${error.message}`);
      }

      if (!response || !response.feedback) {
        console.error('[ERROR - useBehavioralInterview] Invalid feedback response:', response);
        throw new Error('No feedback was generated');
      }

      console.log('[DEBUG - useBehavioralInterview] Feedback received:', response.feedback);

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
      console.error('[ERROR - useBehavioralInterview] Error in generateFeedback:', error);
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
