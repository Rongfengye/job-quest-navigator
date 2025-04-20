
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, Mic } from 'lucide-react';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useToast } from '@/hooks/use-toast';
import { useBehavioralInterview } from '@/hooks/useBehavioralInterview';
import { useUserTokens } from '@/hooks/useUserTokens';
import { useResumeText } from '@/hooks/useResumeText';
import Loading from '@/components/ui/loading';

const BehavioralInterview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { deductTokens } = useUserTokens();
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const { resumeText } = useResumeText(null);
  
  // Get form data from location state or use defaults
  const formData = location.state?.formData || {
    jobTitle: 'Software Developer',
    jobDescription: 'A position requiring strong technical and interpersonal skills.',
    companyName: 'Tech Company',
    companyDescription: 'A leading technology company.'
  };

  // Check if we have pre-generated questions from the form submission
  const generatedQuestions = location.state?.generatedQuestions;

  const {
    isLoading,
    currentQuestionIndex,
    currentQuestion,
    interviewComplete,
    generateQuestion,
    submitAnswer,
    resetInterview,
    setInitialQuestions
  } = useBehavioralInterview();

  // Create a callback function for the voice recording hook
  const handleTranscription = (text: string) => {
    setAnswer(prev => prev ? `${prev}\n\n${text}` : text);
  };

  const {
    isRecording,
    startRecording,
    stopRecording
  } = useVoiceRecording(handleTranscription);

  // Initialize the interview when the page loads
  useEffect(() => {
    const initializeInterview = async () => {
      if (!pageLoaded) {
        setPageLoaded(true);
        
        // Deduct a token for starting the interview
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
        
        // Check if we already have questions from the form submission
        if (generatedQuestions) {
          // Use the pre-generated questions
          setInitialQuestions(generatedQuestions);
        } else {
          // Make sure we have resume text
          const stateResumeText = location.state?.resumeText;
          if (!stateResumeText && !resumeText) {
            toast({
              variant: "destructive",
              title: "Resume text missing",
              description: "We couldn't extract text from your resume. Please try again.",
            });
            navigate('/behavioral/create');
            return;
          }
          
          // Generate the first question
          const coverLetterText = location.state?.coverLetterText || '';
          const additionalDocumentsText = location.state?.additionalDocumentsText || '';
          
          await generateQuestion(
            formData, 
            stateResumeText || resumeText, 
            coverLetterText, 
            additionalDocumentsText
          );
        }
      }
    };
    
    initializeInterview();
  }, [pageLoaded, deductTokens, formData, generateQuestion, navigate, resumeText, location.state, toast, generatedQuestions, setInitialQuestions]);

  // Handle question submission
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
      // Submit the current answer
      submitAnswer(answer);
      setAnswer(''); // Clear the answer field
      
      // If not the last question, generate the next one
      if (currentQuestionIndex < 4) {
        // Use a small delay to allow state updates to complete
        setTimeout(async () => {
          // Deduct a token for each new question
          const tokenCheck = await deductTokens(1);
          if (!tokenCheck?.success) {
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
          setIsSubmitting(false);
        }, 500);
      } else {
        // Interview is complete
        setIsSubmitting(false);
        navigate('/behavioral', { state: { interviewComplete: true } });
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setIsSubmitting(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was an error submitting your answer. Please try again.",
      });
    }
  };

  // Toggle voice recording
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
        <div className="mb-8 flex justify-between items-center">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => navigate('/behavioral')}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          
          <div className="text-sm text-gray-500">
            Question {currentQuestionIndex + 1} of 5
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 flex-1">
          <h2 className="text-xl md:text-2xl font-semibold mb-2 text-interview-primary">
            {currentQuestion?.question || 'Loading question...'}
          </h2>
          
          {currentQuestion?.keyPoints && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <p className="font-medium text-sm text-blue-700 mb-2">Key points to address:</p>
              <ul className="list-disc pl-5 text-sm text-blue-800">
                {currentQuestion.keyPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="answer" className="block text-sm font-medium text-gray-700">
                Your Answer
              </label>
              
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  size="sm"
                  variant={isRecording ? "destructive" : "outline"}
                  onClick={toggleRecording}
                  className="flex items-center gap-1"
                >
                  <Mic className="h-4 w-4" />
                  {isRecording ? 'Stop' : 'Record'}
                </Button>
              </div>
            </div>
            
            <Textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="min-h-[200px]"
              placeholder="Type your answer here..."
            />
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading}
            className="bg-interview-primary hover:bg-interview-dark text-white flex items-center gap-2"
          >
            {isSubmitting ? (
              <>Processing...</>
            ) : currentQuestionIndex < 4 ? (
              <>Next Question <ArrowRight className="w-4 h-4" /></>
            ) : (
              <>Finish Interview</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BehavioralInterview;
