
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useToast } from '@/hooks/use-toast';
import { useBehavioralInterview } from '@/hooks/useBehavioralInterview';
import { useUserTokens } from '@/hooks/useUserTokens';
import { useResumeText } from '@/hooks/useResumeText';
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
  const [pageLoaded, setPageLoaded] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);
  const { resumeText } = useResumeText(null);
  
  // Initial state logging
  console.log('MAY 31 DEBUG - Component initialized with states:', {
    showProcessing,
    pageLoaded
  });
  
  // Extract file paths from location state
  const resumePath = location.state?.resumePath || '';
  const coverLetterPath = location.state?.coverLetterPath || '';
  const additionalDocumentsPath = location.state?.additionalDocumentsPath || '';
  
  console.log("BehavioralInterview - Resume path from state:", resumePath);
  
  const formData = location.state?.formData || {
    jobTitle: 'Software Developer',
    jobDescription: 'A position requiring strong technical and interpersonal skills.',
    companyName: 'Tech Company',
    companyDescription: 'A leading technology company.'
  };

  const {
    isLoading,
    isInitialLoading,
    isTransitionLoading,
    currentQuestionIndex,
    currentQuestion,
    generateQuestion,
    submitAnswer,
    questions,
    answers,
    behavioralId,
    generateFeedback,
    interviewComplete,
    setIsTransitionLoading
  } = useBehavioralInterview();

  // Debug logging for key states from useBehavioralInterview hook
  console.log('MAY 31 DEBUG - Hook states:', {
    isLoading,
    isInitialLoading,
    isTransitionLoading,
    currentQuestion: currentQuestion ? 'Question exists' : 'No question',
    currentQuestionIndex
  });

  // Watch for currentQuestion changes
  useEffect(() => {
    console.log('MAY 31 DEBUG - currentQuestion changed:', {
      hasQuestion: !!currentQuestion,
      questionText: currentQuestion?.question ? currentQuestion.question.substring(0, 50) + '...' : 'No question',
      isInitialLoading
    });
  }, [currentQuestion, isInitialLoading]);

  // Watch for isLoading changes
  useEffect(() => {
    console.log('MAY 31 DEBUG - isLoading changed:', isLoading);
  }, [isLoading]);

  // Watch for isInitialLoading changes
  useEffect(() => {
    console.log('MAY 31 DEBUG - isInitialLoading changed:', isInitialLoading);
  }, [isInitialLoading]);

  // Watch for isTransitionLoading changes
  useEffect(() => {
    console.log('MAY 31 DEBUG - isTransitionLoading changed:', isTransitionLoading);
  }, [isTransitionLoading]);

  const playTransitionAudio = () => {
    // Select a random audio file each time this function is called
    const selectedNumber = Math.floor(Math.random() * 10) + 1;
    const audioPath = `/audio-assets/audio${selectedNumber}.mp3`;
    
    const audio = new Audio(audioPath);
    
    return new Promise<void>((resolve) => {
      // Increased delay from 750ms to 1500ms before playing the audio
      setTimeout(() => {
        audio.onended = () => {
          resolve();
        };
        
        audio.onerror = () => {
          console.error('Error playing audio');
          resolve(); // Resolve anyway to continue the flow
        };
        
        audio.play().catch(error => {
          console.error('Error playing audio:', error);
          resolve(); // Resolve anyway to continue the flow
        });
      }, 1500); // Changed from 750ms to 1500ms
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

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackGenerated, setFeedbackGenerated] = useState(false);
  const [feedbackData, setFeedbackData] = useState(null);
  const [allAnswersSubmitted, setAllAnswersSubmitted] = useState(false);

  useEffect(() => {
    const initializeInterview = async () => {
      if (!pageLoaded) {
        console.log('MAY 31 DEBUG - Starting interview initialization');
        setPageLoaded(true);
        
        const tokenCheck = await deductTokens(1);
        if (!tokenCheck?.success) {
          toast({
            variant: "destructive",
            title: "Insufficient tokens",
            description: "You need at least 1 token to start a behavioral interview.",
          });
          navigate('/behavioral');
          return;
        }
        
        // Always generate the first question directly
        if (!location.state?.resumeText && !resumeText) {
          toast({
            variant: "destructive",
            title: "Resume text missing",
            description: "We couldn't extract text from your resume. Please try again.",
          });
          navigate('/behavioral/create');
          return;
        }
        
        console.log("Initializing interview with resume path:", resumePath);
        console.log('MAY 31 DEBUG - About to call generateQuestion for first question');
        
        await generateQuestion(
          formData, 
          location.state?.resumeText || resumeText, 
          location.state?.coverLetterText || '',
          location.state?.additionalDocumentsText || '',
          resumePath,
          coverLetterPath,
          additionalDocumentsPath
        );
        
        console.log('MAY 31 DEBUG - generateQuestion call completed for first question');
      }
    };
    
    initializeInterview();
  }, [pageLoaded, deductTokens, formData, generateQuestion, navigate, resumeText, location.state, toast, behavioralId, resumePath, coverLetterPath, additionalDocumentsPath]);

  // Modified effect to handle feedback generation when interview is complete
  useEffect(() => {
    // Check if we have 5 answers and the interview is complete (this means question 5 was just submitted)
    if (answers.length === 5 && interviewComplete && !feedbackGenerated) {
      const generateFeedbackWithAnswers = async () => {
        try {
          setShowFeedbackModal(true);
          console.log('All 5 answers collected, generating feedback with:', answers);
          const feedback = await generateFeedback();
          
          if (feedback) {
            setFeedbackData(feedback);
            setFeedbackGenerated(true);
            
            // Get the most recent behavioral data to pass to feedback page
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
                interviewData: behavioralData // Include the complete interview data
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
  }, [answers, interviewComplete, feedbackGenerated, generateFeedback, navigate, questions, behavioralId, toast]);

  const handleSubmit = async () => {
    if (!answer.trim()) {
      toast({
        variant: "destructive",
        title: "Answer required",
        description: "Please provide an answer before continuing.",
      });
      return;
    }
    
    // Show processing immediately
    setShowProcessing(true);
    setIsSubmitting(true);
    console.log('MAY 31 DEBUG - Starting answer submission, showProcessing set to true');
    
    try {
      await submitAnswer(answer);
      
      // After submitting the 5th question (index 4), we don't need to generate a new question
      if (currentQuestionIndex < 4) {
        console.log('MAY 31 DEBUG - Submitting answer for question', currentQuestionIndex + 1, 'of 5');
        
        // Play transition audio before loading next question
        try {
          await playTransitionAudio();
        } catch (error) {
          console.error('Error playing transition audio:', error);
          // Continue even if audio fails
        }
        
        const tokenCheck = await deductTokens(1);
        if (!tokenCheck?.success) {
          setIsSubmitting(false);
          setIsTransitionLoading(false);
          setShowProcessing(false);
          toast({
            variant: "destructive",
            title: "Insufficient tokens",
            description: "You need 1 token to continue to the next question.",
          });
          navigate('/behavioral');
          return;
        }
        
        console.log('MAY 31 DEBUG - About to generate next question');
        await generateQuestion(
          formData, 
          location.state?.resumeText || resumeText, 
          location.state?.coverLetterText || '',
          location.state?.additionalDocumentsText || '',
          resumePath,
          coverLetterPath,
          additionalDocumentsPath
        );
        
        console.log('MAY 31 DEBUG - Next question generated, clearing states');
        setAnswer('');
        setIsTransitionLoading(false);
        setShowProcessing(false);
      } else {
        setAnswer('');
        setShowFeedbackModal(true);
        
        // Let the useEffect handle the feedback generation
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

  // Log the condition that determines Loading vs ProcessingMessages
  console.log('MAY 31 DEBUG - Rendering condition check:', {
    isTransitionLoading,
    showProcessing,
    hasCurrentQuestion: !!currentQuestion,
    isLoading,
    isInitialLoading
  });

  // Only show full-screen Loading for transitions between questions (not initial load)
  if (isTransitionLoading) {
    console.log('MAY 31 DEBUG - Rendering full-screen Loading component for question transition');
    return <Loading />;
  }

  console.log('MAY 31 DEBUG - Rendering main interview layout');
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
            {isInitialLoading && !currentQuestion ? (
              <div className="h-full flex flex-col items-center justify-center">
                <ProcessingMessages 
                  messages={[
                    "Setting up your interview experience…",
                    "Generating your first challenge…",
                    "Getting your first question ready…",
                    "Warming up the interview engine…"
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
          isNextQuestionLoading={isTransitionLoading}
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
