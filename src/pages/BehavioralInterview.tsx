import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useBehavioralInterview } from '@/hooks/useBehavioralInterview';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useResumeText } from '@/hooks/useResumeText';
import { supabase } from '@/integrations/supabase/client';
import Loading from '@/components/ui/loading';
import { Mic, MicOff, Send } from 'lucide-react';
import ProcessingModal from '@/components/ProcessingModal';
import NavBar from '@/components/NavBar';
import InterviewHeader from '@/components/behavioral/InterviewHeader';
import QuestionContent from '@/components/behavioral/QuestionContent';
import SubmitButton from '@/components/behavioral/SubmitButton';
import SimpleValidationDisplay from '@/components/behavioral/SimpleValidationDisplay';
// Import validation utils for submit-time validation only
import { validateAnswer, getValidationMessage, shouldBlockSubmission } from '@/utils/answerValidation';

const BehavioralInterview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);
  const [shouldGenerateNext, setShouldGenerateNext] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resumedFormData, setResumedFormData] = useState<any>(null);
  const [isResumingAndLoading, setIsResumingAndLoading] = useState(false);
  const { resumeText } = useResumeText(null);
  
  // Submit-time validation state only
  const [overrideAttempt, setOverrideAttempt] = useState(false);
  const [showValidationDisplay, setShowValidationDisplay] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  
  // Reset override attempt and validation display when answer changes
  useEffect(() => {
    setOverrideAttempt(false);
    // Hide validation display when user starts typing after seeing it
    if (showValidationDisplay && answer.trim().length > 0) {
      setShowValidationDisplay(false);
      setValidationResult(null);
    }
  }, [answer, showValidationDisplay]);
  
  // Extract data from location state with error handling
  const locationState = location.state || {};
  const isResuming = locationState.isResuming || false;
  const resumePath = locationState.resumePath || '';
  const coverLetterPath = locationState.coverLetterPath || '';
  const additionalDocumentsPath = locationState.additionalDocumentsPath || '';
  const firstQuestion = locationState.firstQuestion;
  const behavioralId = locationState.behavioralId;
  
  console.log("BehavioralInterview - Is resuming:", isResuming);
  console.log("BehavioralInterview - Behavioral ID:", behavioralId);
  console.log("BehavioralInterview - Resume path from state:", resumePath);
  console.log("BehavioralInterview - First question:", firstQuestion ? 'Loaded' : 'Not provided');
  
  const formData = locationState.formData || resumedFormData || {
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
    generateFeedback,
    interviewComplete,
    setIsTransitionLoading,
    setCurrentQuestion,
    setBehavioralId,
    loadExistingOrSetupInterview
  } = useBehavioralInterview();

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

  // Updated initialization effect using the new hybrid function
  useEffect(() => {
    const initializeInterview = async () => {
      if (!pageLoaded) {
        console.log('Initializing interview - behavioralId:', behavioralId);
        setPageLoaded(true);
        
        // Validate that we have a behavioral ID
        if (!behavioralId) {
          toast({
            variant: "destructive",
            title: "Interview setup incomplete",
            description: "Please go through the setup process again.",
          });
          navigate('/behavioral/create');
          return;
        }
        
        // Use the new hybrid function that handles both resuming and fresh starts
        try {
          console.log('Using hybrid function to load/setup interview');
          const loadedData = await loadExistingOrSetupInterview(behavioralId, firstQuestion);
          setResumedFormData(loadedData.formData);
          if (firstQuestion) {
            setCurrentQuestion({
              question: firstQuestion.question,
              questionIndex: 0,
              audio: firstQuestion.audio || null
            });
          }
          console.log('Interview initialized successfully');
        } catch (error) {
          console.error('Failed to initialize interview:', error);
          toast({
            variant: "destructive",
            title: "Failed to initialize interview",
            description: "We couldn't load your interview. Please try again from the dashboard.",
          });
          navigate('/behavioral');
          return;
        }
      }
    };
    
    initializeInterview();
  }, [pageLoaded, behavioralId, firstQuestion, navigate, toast, loadExistingOrSetupInterview]);

  // Simplified useEffect to handle question generation - only depends on essential state
  useEffect(() => {
    const generateNextQuestion = async () => {
      // Guard conditions - prevent multiple simultaneous generations
      if (!shouldGenerateNext || currentQuestionIndex === 0 || currentQuestionIndex >= 5 || isGenerating) {
        return;
      }

      console.log(`Generating question for index: ${currentQuestionIndex}`);
      setIsGenerating(true);
      
      try {
        // Play transition audio before loading next question
        try {
          await playTransitionAudio();
        } catch (error) {
          console.error('Error playing transition audio:', error);
          // Continue even if audio fails
        }
        
        console.log('About to generate next question with correct index:', currentQuestionIndex);
        await generateQuestion(
          formData, 
          locationState.resumeText || resumeText, 
          locationState.coverLetterText || '',
          locationState.additionalDocumentsText || '',
          resumePath,
          coverLetterPath,
          additionalDocumentsPath
        );
        
        console.log('Next question generated, clearing states');
        setAnswer('');
        setIsTransitionLoading(false);
        setShowProcessing(false);
        setShouldGenerateNext(false);
        setIsResumingAndLoading(false); // Hide loader after question is generated
      } catch (error) {
        console.error('Error generating next question:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "There was an error generating the next question. Please try again.",
        });
        setShowProcessing(false);
        setShouldGenerateNext(false);
        setIsResumingAndLoading(false); // Also hide loader on error
      } finally {
        setIsGenerating(false);
      }
    };

    generateNextQuestion();
  }, [currentQuestionIndex, shouldGenerateNext]);

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

  // Updated effect for handling question generation when resuming
  useEffect(() => {
    if (
      pageLoaded &&
      !currentQuestion &&
      !isGenerating &&
      !isInitialLoading &&
      currentQuestionIndex > 0 &&
      currentQuestionIndex < 5
    ) {
      console.log('Triggering next question generation after initialization.');
      setIsResumingAndLoading(true);
      setShouldGenerateNext(true);
    }
  }, [
    pageLoaded,
    currentQuestion,
    isGenerating,
    isInitialLoading,
    currentQuestionIndex,
  ]);

  const handleSubmit = async () => {
    if (!answer.trim()) {
      toast({
        variant: "destructive",
        title: "Answer required",
        description: "Please provide an answer before continuing.",
      });
      return;
    }
    
    // Submit-time validation - only check when user tries to submit
    const validation = validateAnswer(answer.trim());
    
    if (!validation.isValid) {
      const shouldBlock = shouldBlockSubmission(validation, overrideAttempt);
      
      if (shouldBlock && !overrideAttempt) {
        // EXTREME cases only - block and offer override (< 20 words, spam, etc.)
        toast({
          variant: "destructive",
          title: "❗ Answer Too Short",
          description: "Your answer needs significant improvement. Please add more detail or click submit again to override.",
          duration: 5000,
        });
        
        setOverrideAttempt(true);
        return; // Block submission
      } else if (shouldBlock && overrideAttempt) {
        // Override attempt - allow but log
        toast({
          variant: "default",
          title: "⚠️ Override Accepted",
          description: "Submitting with incomplete answer. This may affect your evaluation.",
        });
      } else {
        // NORMAL validation failures - show visual validation display below text area
        if (!showValidationDisplay) {
          setValidationResult(validation);
          setShowValidationDisplay(true);
          
          // Simple toast without detailed warnings
          toast({
            variant: "default",
            title: "💡 Consider Adding More Detail",
            description: "You can still submit, but consider improving your answer for better evaluation.",
            duration: 3000,
          });
        }
      }
      
      // Log validation for analytics
      console.log('[Validation]', {
        questionIndex: currentQuestionIndex,
        validation,
        wasBlocked: shouldBlock && !overrideAttempt,
        wasOverridden: overrideAttempt,
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if microphone is recording and stop it first
    if (isRecording) {
      console.log('Stopping recording before submitting answer');
      await stopRecording();
      
      toast({
        title: "Recording stopped",
        description: "Your recording has been processed and added to your answer.",
      });
      
      // Add a small delay to ensure transcription processing completes
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Show processing immediately
    setShowProcessing(true);
    setIsSubmitting(true);
    console.log('Starting answer submission for question', currentQuestionIndex + 1, 'of 5');
    
    try {
      await submitAnswer(answer);
      
      // After submitting the 5th question (index 4), we don't need to generate a new question
      if (currentQuestionIndex < 4) {
        console.log('Submitting answer for question', currentQuestionIndex + 1, 'of 5');
        
        // Set flag to generate next question - the useEffect will handle it when currentQuestionIndex updates
        setShouldGenerateNext(true);
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

  // Show loading screen when:
  // 1. Initially loading (before first question appears)  
  // 2. Transitioning between questions
  // 3. Resuming and loading existing interview
  // 4. No current question but interview not complete
  if (isInitialLoading || isTransitionLoading || isResumingAndLoading || (!currentQuestion && !interviewComplete)) {
    console.log('Rendering full-screen Loading component', {
      isInitialLoading,
      isTransitionLoading,
      isResumingAndLoading,
      hasCurrentQuestion: !!currentQuestion,
      currentQuestionIndex,
      interviewComplete
    });
    return <Loading />;
  }

  console.log('Rendering main interview layout');
  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-white flex flex-col p-6 pb-32">
        <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col">
          <InterviewHeader />
          
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 flex-1 flex flex-col">
            <QuestionContent
              currentQuestionIndex={currentQuestionIndex}
              currentQuestion={currentQuestion}
              answer={answer}
              setAnswer={setAnswer}
              isRecording={isRecording}
              toggleRecording={toggleRecording}
            />
            
            {/* Simple Validation Display - only shows warnings after failed submit */}
            {showValidationDisplay && validationResult && (
              <SimpleValidationDisplay
                validation={validationResult}
                isVisible={showValidationDisplay}
              />
            )}
          </div>
          
          <SubmitButton
            currentQuestionIndex={currentQuestionIndex}
            isSubmitting={isSubmitting}
            isLoading={isLoading}
            isNextQuestionLoading={isTransitionLoading}
            onClick={handleSubmit}
            showProcessing={showProcessing}
            answerLength={answer.trim().length}
          />
        </div>
        
        <ProcessingModal 
          isOpen={showFeedbackModal} 
          processingMessage="Generating Interview Feedback" 
        />
      </div>
    </>
  );
};

export default BehavioralInterview;
