
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useToast } from '@/hooks/use-toast';
import { useBehavioralInterview } from '@/hooks/useBehavioralInterview';
import { useUserTokens } from '@/hooks/useUserTokens';
import { supabase } from '@/integrations/supabase/client';
import Loading from '@/components/ui/loading';
import ProcessingModal from '@/components/ProcessingModal';
import InterviewHeader from '@/components/behavioral/InterviewHeader';
import QuestionContent from '@/components/behavioral/QuestionContent';
import SubmitButton from '@/components/behavioral/SubmitButton';
import ProcessingMessages from '@/components/behavioral/ProcessingMessages';

const BehavioralInterview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { deductTokens } = useUserTokens();
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNextQuestionLoading, setIsNextQuestionLoading] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  // Extract data from location state
  const formData = location.state?.formData || {};
  const resumeText = location.state?.resumeText || '';
  const resumePath = location.state?.resumePath || '';
  const coverLetterPath = location.state?.coverLetterPath || '';
  const additionalDocumentsPath = location.state?.additionalDocumentsPath || '';
  const coverLetterText = location.state?.coverLetterText || '';
  const additionalDocumentsText = location.state?.additionalDocumentsText || '';
  const behavioralId = location.state?.behavioralId || null;
  const preloadedQuestion = location.state?.preloadedQuestion || null;
  
  console.log("BehavioralInterview - Received preloaded question:", preloadedQuestion);
  console.log("BehavioralInterview - Behavioral ID:", behavioralId);

  const {
    isLoading,
    currentQuestionIndex,
    currentQuestion,
    generateQuestion,
    submitAnswer,
    questions,
    answers,
    generateFeedback,
    interviewComplete,
    initializeWithPreloadedQuestion
  } = useBehavioralInterview();

  const playTransitionAudio = () => {
    const selectedNumber = Math.floor(Math.random() * 10) + 1;
    const audioPath = `/audio-assets/audio${selectedNumber}.mp3`;
    
    const audio = new Audio(audioPath);
    
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        audio.onended = () => {
          resolve();
        };
        
        audio.onerror = () => {
          console.error('Error playing audio');
          resolve();
        };
        
        audio.play().catch(error => {
          console.error('Error playing audio:', error);
          resolve();
        });
      }, 1500);
    });
  };

  const handleTranscription = (text: string) => {
    setAnswer(prev => prev ? `${prev}\n\n${text}` : text);
  };

  const {
    isRecording,
    startRecording,
    stopRecording
  } = useVoiceRecording(handleTranscription);

  // Initialize with preloaded question
  useEffect(() => {
    if (preloadedQuestion && behavioralId) {
      console.log("Initializing with preloaded question...");
      initializeWithPreloadedQuestion(preloadedQuestion, behavioralId);
    } else if (!preloadedQuestion) {
      console.error("No preloaded question found in navigation state");
      toast({
        variant: "destructive",
        title: "Session Error",
        description: "Interview session data is missing. Please start a new interview.",
      });
      navigate('/behavioral/create');
    }
  }, [preloadedQuestion, behavioralId, initializeWithPreloadedQuestion, toast, navigate]);

  // Handle feedback generation when interview is complete
  useEffect(() => {
    if (answers.length === 5 && interviewComplete) {
      const generateFeedbackWithAnswers = async () => {
        try {
          setShowFeedbackModal(true);
          console.log('All 5 answers collected, generating feedback with:', answers);
          const feedback = await generateFeedback();
          
          if (feedback) {
            const { data: behavioralData } = await supabase
              .from('storyline_behaviorals')
              .select('job_title, job_description, company_name, company_description, resume_path, cover_letter_path, additional_documents_path')
              .eq('id', behavioralId)
              .single();
              
            navigate(`/behavioralFeedback?id=${behavioralId}`, { 
              state: { 
                questions,
                answers,
                behavioralId,
                feedback,
                interviewData: behavioralData
              } 
            });
          } else {
            throw new Error('Failed to generate feedback');
          }
        } catch (error) {
          console.error('Error generating feedback:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to generate feedback. Please try again.",
          });
          setShowFeedbackModal(false);
        }
      };
      
      generateFeedbackWithAnswers();
    }
  }, [answers, interviewComplete, generateFeedback, navigate, questions, behavioralId, toast]);

  const handleSubmit = async () => {
    if (!answer.trim()) {
      toast({
        variant: "destructive",
        title: "Answer required",
        description: "Please provide an answer before continuing.",
      });
      return;
    }
    
    setShowProcessing(true);
    setIsSubmitting(true);
    
    try {
      await submitAnswer(answer);
      
      // After submitting the 5th question (index 4), we don't need to generate a new question
      if (currentQuestionIndex < 4) {
        try {
          await playTransitionAudio();
        } catch (error) {
          console.error('Error playing transition audio:', error);
        }
        
        setIsNextQuestionLoading(true);
        
        const tokenCheck = await deductTokens(1);
        if (!tokenCheck?.success) {
          setIsSubmitting(false);
          setIsNextQuestionLoading(false);
          setShowProcessing(false);
          toast({
            variant: "destructive",
            title: "Insufficient tokens",
            description: "You need 1 token to continue to the next question.",
          });
          navigate('/behavioral');
          return;
        }
        
        await generateQuestion(
          formData, 
          resumeText, 
          coverLetterText,
          additionalDocumentsText,
          resumePath,
          coverLetterPath,
          additionalDocumentsPath
        );
        
        setAnswer('');
        setIsNextQuestionLoading(false);
        setShowProcessing(false);
      } else {
        setAnswer('');
        setShowFeedbackModal(true);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was an error submitting your answer. Please try again.",
      });
      setShowProcessing(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  if (isNextQuestionLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col p-6">
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col">
        <InterviewHeader />
        
        {showProcessing ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 flex-1 flex flex-col items-center justify-center">
            <ProcessingMessages 
              currentQuestionIndex={currentQuestionIndex} 
              isNextQuestion={currentQuestionIndex < 4} 
            />
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 flex-1 flex flex-col">
            {isLoading && !currentQuestion ? (
              <div className="h-full flex flex-col items-center justify-center">
                <ProcessingMessages 
                  messages={[
                    "Loading your interview session...",
                    "Preparing your first question...",
                    "Setting up the interview environment..."
                  ]}
                />
              </div>
            ) : (
              <QuestionContent
                currentQuestionIndex={currentQuestionIndex}
                currentQuestion={currentQuestion}
                answer={answer}
                setAnswer={setAnswer}
                isRecording={isRecording}
                toggleRecording={toggleRecording}
              />
            )}
          </div>
        )}
        
        <SubmitButton
          currentQuestionIndex={currentQuestionIndex}
          isSubmitting={isSubmitting}
          isLoading={isLoading}
          isNextQuestionLoading={isNextQuestionLoading}
          onClick={handleSubmit}
          showProcessing={showProcessing}
        />
      </div>
      
      <ProcessingModal 
        isOpen={showFeedbackModal} 
        processingMessage="Generating Interview Feedback" 
      />
    </div>
  );
};

export default BehavioralInterview;
