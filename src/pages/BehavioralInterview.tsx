import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useToast } from '@/hooks/use-toast';
import { useBehavioralInterview } from '@/hooks/useBehavioralInterview';
import { useUserTokens } from '@/hooks/useUserTokens';
import { useResumeText } from '@/hooks/useResumeText';
import Loading from '@/components/ui/loading';
import ProcessingModal from '@/components/ProcessingModal';
import InterviewHeader from '@/components/behavioral/InterviewHeader';
import QuestionContent from '@/components/behavioral/QuestionContent';
import SubmitButton from '@/components/behavioral/SubmitButton';

const BehavioralInterview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { deductTokens } = useUserTokens();
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [isNextQuestionLoading, setIsNextQuestionLoading] = useState(false);
  const { resumeText } = useResumeText(null);
  
  const formData = location.state?.formData || {
    jobTitle: 'Software Developer',
    jobDescription: 'A position requiring strong technical and interpersonal skills.',
    companyName: 'Tech Company',
    companyDescription: 'A leading technology company.'
  };

  const generatedQuestions = location.state?.generatedQuestions;

  const {
    isLoading,
    currentQuestionIndex,
    currentQuestion,
    generateQuestion,
    submitAnswer,
    questions,
    answers,
    behavioralId,
    setInitialQuestions,
    generateFeedback,
    isMuted,
    isPlaying,
    toggleMute,
    playQuestionAudio
  } = useBehavioralInterview();

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
        
        if (generatedQuestions) {
          setInitialQuestions(generatedQuestions);
        } else {
          if (!location.state?.resumeText && !resumeText) {
            toast({
              variant: "destructive",
              title: "Resume text missing",
              description: "We couldn't extract text from your resume. Please try again.",
            });
            navigate('/behavioral/create');
            return;
          }
          
          const coverLetterText = location.state?.coverLetterText || '';
          const additionalDocumentsText = location.state?.additionalDocumentsText || '';
          
          await generateQuestion(
            formData, 
            location.state?.resumeText || resumeText, 
            coverLetterText, 
            additionalDocumentsText
          );
        }
      }
    };
    
    initializeInterview();
  }, [pageLoaded, deductTokens, formData, generateQuestion, navigate, resumeText, location.state, toast, generatedQuestions, setInitialQuestions, behavioralId]);

  useEffect(() => {
    if (answers.length === 5 && allAnswersSubmitted && showFeedbackModal) {
      const generateFeedbackWithAnswers = async () => {
        try {
          console.log('All 5 answers collected, generating feedback with:', answers);
          const feedback = await generateFeedback();
          
          if (feedback) {
            setFeedbackData(feedback);
            setFeedbackGenerated(true);
            
            navigate(`/behavioralFeedback?id=${behavioralId}`, { 
              state: { 
                questions,
                answers,
                behavioralId,
                feedback
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
          setAllAnswersSubmitted(false);
        }
      };
      
      generateFeedbackWithAnswers();
    }
  }, [answers, allAnswersSubmitted, showFeedbackModal, generateFeedback, navigate, questions, behavioralId, toast]);

  const handleSubmit = async () => {
    if (!answer.trim()) {
      toast({
        variant: "destructive",
        title: "Answer required",
        description: "Please provide an answer before continuing.",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await submitAnswer(answer);
      
      if (currentQuestionIndex < 4) {
        setIsNextQuestionLoading(true);
        
        const tokenCheck = await deductTokens(1);
        if (!tokenCheck?.success) {
          setIsSubmitting(false);
          setIsNextQuestionLoading(false);
          toast({
            variant: "destructive",
            title: "Insufficient tokens",
            description: "You need 1 token to continue to the next question.",
          });
          navigate('/behavioral');
          return;
        }
        
        const coverLetterText = location.state?.coverLetterText || '';
        const additionalDocumentsText = location.state?.additionalDocumentsText || '';
        const stateResumeText = location.state?.resumeText;
        
        await generateQuestion(
          formData, 
          stateResumeText || resumeText, 
          coverLetterText, 
          additionalDocumentsText
        );
        
        setAnswer('');
        setIsNextQuestionLoading(false);
        setIsSubmitting(false);
      } else {
        setAnswer('');
        setShowFeedbackModal(true);
        
        setTimeout(() => {
          setAllAnswersSubmitted(true);
        }, 1000);
        
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setIsSubmitting(false);
      setIsNextQuestionLoading(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was an error submitting your answer. Please try again.",
      });
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  if (isLoading && !currentQuestion) {
    return <Loading message="Preparing your interview questions..." />;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col p-6">
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col">
        <InterviewHeader />
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 flex-1 flex flex-col">
          {isNextQuestionLoading ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-interview-primary mb-4"></div>
              <p className="text-gray-600">Loading next question...</p>
            </div>
          ) : (
            <QuestionContent
              currentQuestionIndex={currentQuestionIndex}
              currentQuestion={currentQuestion}
              answer={answer}
              setAnswer={setAnswer}
              isRecording={isRecording}
              toggleRecording={toggleRecording}
              isMuted={isMuted}
              isPlaying={isPlaying}
              toggleMute={toggleMute}
              playQuestionAudio={playQuestionAudio}
            />
          )}
        </div>
        
        <SubmitButton
          currentQuestionIndex={currentQuestionIndex}
          isSubmitting={isSubmitting}
          isLoading={isLoading}
          isNextQuestionLoading={isNextQuestionLoading}
          onClick={handleSubmit}
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
