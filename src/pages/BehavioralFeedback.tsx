
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import FeedbackOverview from '@/components/answer/FeedbackOverview';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Loading from '@/components/ui/loading';
import { useAuthContext } from '@/context/AuthContext';
import NavBar from '@/components/NavBar';
import { filterValue } from '@/utils/supabaseTypes';
import { useJobPracticeSubmission } from '@/hooks/useJobPracticeSubmission';
import ProcessingModal from '@/components/ProcessingModal';

const BehavioralFeedback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [interviewData, setInterviewData] = useState<any>(null);
  const { isAuthenticated, isLoading: authLoading, user } = useAuthContext();

  const interviewId = searchParams.get('id') || location.state?.behavioralId;
  const hasFeedbackInState = !!location.state?.feedback;
  const hasQuestionsInState = !!location.state?.questions && Array.isArray(location.state.questions);

  // Empty placeholder data for the useJobPracticeSubmission hook
  // We'll use the real data from interviewData when calling submitJobPractice
  const emptyFormData = {
    jobTitle: '',
    jobDescription: '',
    companyName: '',
    companyDescription: ''
  };
  
  const emptyFileData = {
    file: null,
    text: ''
  };

  const { isLoading: isCreatingQuestions, processingModal, submitJobPractice } = 
    useJobPracticeSubmission(
      user?.id,
      emptyFormData,
      emptyFileData,
      emptyFileData,
      emptyFileData,
      interviewId
    );

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to view feedback.",
      });
      navigate('/', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate, toast]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return;
    }
    
    if (hasFeedbackInState && hasQuestionsInState) {
      setFeedback(location.state.feedback);
      setQuestions(location.state.questions.map(String));
      
      // Save interview data if it's in location state
      if (location.state.interviewData) {
        setInterviewData(location.state.interviewData);
      }
      
      setIsLoading(false);
      return;
    }
    
    const fetchInterviewData = async () => {
      if (!interviewId) {
        setError('No interview ID provided');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('storyline_behaviorals')
          .select('questions, feedback, responses, job_title, job_description, company_name, company_description, resume_path, cover_letter_path, additional_documents_path')
          .eq('id', filterValue(interviewId))
          .single();

        if (error) throw error;
        
        if (!data || !data.questions || !data.feedback) {
          setError('No feedback data found for this interview');
          setIsLoading(false);
          return;
        }

        const questionsData = data.questions as any[];
        const processedQuestions = Array.isArray(questionsData) 
          ? questionsData.map(q => String(q)) 
          : [];
          
        setQuestions(processedQuestions);
        setFeedback(data.feedback);
        setInterviewData(data);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching interview data:', err);
        setError('Failed to load feedback data');
        setIsLoading(false);
        
        toast({
          variant: "destructive",
          title: "Error loading feedback",
          description: "Could not load the interview feedback data.",
        });
      }
    };

    fetchInterviewData();
  }, [interviewId, toast, hasFeedbackInState, hasQuestionsInState, location.state, authLoading, isAuthenticated]);

  const handleContinueToQuestions = async () => {
    if (!interviewData) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Interview data is missing. Cannot continue to questions.",
      });
      return;
    }

    // Use the real data from the interview for creating technical questions
    const formData = {
      jobTitle: interviewData.job_title,
      jobDescription: interviewData.job_description,
      companyName: interviewData.company_name || '',
      companyDescription: interviewData.company_description || ''
    };

    try {
      // The actual resumeFile and other files will be used from the behavioral interview
      // via the behavioralId, so we can use empty data here
      await submitJobPractice();
    } catch (error) {
      console.error("Error generating technical questions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate technical questions. Please try again."
      });
    }
  };

  if (authLoading) {
    return <Loading message="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return <Loading message="Loading feedback data..." />;
  }

  if (error || !feedback) {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Missing feedback data</h2>
          <p className="text-gray-500 mb-4">{error || "Could not load feedback. Returning to interview page."}</p>
          <Button 
            variant="outline" 
            onClick={() => navigate('/behavioral')}
          >
            Return to Interview Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <NavBar />
      {processingModal && (
        <ProcessingModal 
          isOpen={processingModal}
          title="Generating Technical Questions" 
          processingMessage="We're creating technical interview questions based on your behavioral interview responses..." 
        />
      )}
      <div className="min-h-screen bg-white p-6">
        <div className="w-full max-w-4xl mx-auto">
          <div className="mb-8">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => navigate('/behavioral')}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Interview Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <FeedbackOverview 
                feedback={feedback} 
                questions={questions} 
              />
            </CardContent>
            <CardFooter className="flex justify-center border-t pt-4">
              <Button
                className="flex items-center gap-2"
                onClick={handleContinueToQuestions}
                disabled={isCreatingQuestions}
              >
                <BookOpen className="w-4 h-4" />
                {isCreatingQuestions ? 'Generating Questions...' : 'Continue with Technical Questions'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
};

export default BehavioralFeedback;
