import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, InfoIcon } from 'lucide-react';
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
import RelatedPracticesList from '@/components/behavioral/RelatedPracticesList';

interface RelatedPractice {
  id: string;
  job_title: string;
  company_name: string | null;
  created_at: string;
  status: string | null;
}

const BehavioralFeedback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<string[]>([]);
  const [responses, setResponses] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [interviewData, setInterviewData] = useState<any>(null);
  const { isAuthenticated, isLoading: authLoading, user } = useAuthContext();
  const [relatedPractices, setRelatedPractices] = useState<RelatedPractice[] | null>(null);
  const [isLoadingPractices, setIsLoadingPractices] = useState(false);

  const interviewId = searchParams.get('id') || location.state?.behavioralId;

  // Empty placeholder data for the useJobPracticeSubmission hook
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
      interviewId,
      questions
    );

  // Handle authentication check
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

  // Main data fetching effect
  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return;
    }
    
    const fetchInterviewData = async () => {
      console.log('Starting data fetch, isLoading:', true);
      setIsLoading(true); // Ensure loading is set to true at start
      
      if (!interviewId) {
        console.log('No interview ID provided');
        setError('No interview ID provided');
        setIsLoading(false);
        return;
      }

      try {
        console.log('Fetching interview data for ID:', interviewId);
        const { data, error: fetchError } = await supabase
          .from('storyline_behaviorals')
          .select('questions, feedback, responses, job_title, job_description, company_name, company_description, resume_path, cover_letter_path, additional_documents_path')
          .eq('id', filterValue(interviewId))
          .single();

        if (fetchError) {
          console.error('Database fetch error:', fetchError);
          throw fetchError;
        }
        
        if (!data) {
          console.log('No data found for interview ID');
          setError('No interview data found');
          setIsLoading(false);
          return;
        }

        console.log('Data fetched successfully, checking for feedback...');
        
        // If we have data but no feedback yet, keep loading
        if (!data.feedback) {
          console.log('Feedback not yet available, staying in loading state...');
          // Don't set isLoading to false - keep showing loading spinner
          // The user will need to refresh or we could add a retry mechanism
          return;
        }

        console.log('Feedback available, processing data...');
        
        const questionsData = data.questions as any[];
        const processedQuestions = Array.isArray(questionsData) 
          ? questionsData.map(q => String(q)) 
          : [];
          
        const responsesData = data.responses as any[];
        const processedResponses = Array.isArray(responsesData)
          ? responsesData.map(r => String(r))
          : [];
          
        setQuestions(processedQuestions);
        setResponses(processedResponses);
        setFeedback(data.feedback);
        setInterviewData(data);
        
        console.log('Data processing complete, setting isLoading to false');
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
  }, [interviewId, toast, authLoading, isAuthenticated]);

  // Fetch related practices
  useEffect(() => {
    if (!interviewId || !isAuthenticated) return;
    
    const fetchRelatedPractices = async () => {
      setIsLoadingPractices(true);
      try {
        const { data, error } = await supabase
          .from('storyline_jobs')
          .select('id, job_title, company_name, created_at, status')
          .eq('behavioral_id', interviewId)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setRelatedPractices(data);
      } catch (err) {
        console.error('Error fetching related practices:', err);
        setRelatedPractices(null);
      } finally {
        setIsLoadingPractices(false);
      }
    };

    fetchRelatedPractices();
  }, [interviewId, isAuthenticated]);

  const handleContinueToQuestions = () => {
    if (!interviewData) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Interview data is missing. Cannot continue to questions.",
      });
      return;
    }

    try {
      submitJobPractice();
    } catch (error) {
      console.error("Error generating technical questions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate technical questions. Please try again."
      });
    }
  };

  // Early returns following senior engineer's recommendations
  
  // 1. Always check authentication loading first
  if (authLoading) {
    return <Loading message="Checking authentication..." />;
  }

  // 2. If not authenticated, return null (will be redirected)
  if (!isAuthenticated) {
    return null;
  }

  // 3. Check if still loading - this is the key fix
  if (isLoading) {
    return <Loading message="Loading feedback data..." />;
  }

  // 4. Only show error if NOT loading
  if (error) {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Missing feedback data</h2>
          <p className="text-gray-500 mb-4">{error}</p>
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

  // 5. If no feedback but also no error and not loading, something went wrong
  if (!feedback) {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No feedback available</h2>
          <p className="text-gray-500 mb-4">Feedback data is not available for this interview.</p>
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

  // Check if there's at least one related practice
  const hasRelatedPractice = relatedPractices && relatedPractices.length > 0;

  return (
    <>
      <NavBar />
      {processingModal && (
        <ProcessingModal 
          isOpen={processingModal}
          title="Generating Practice Questions" 
          processingMessage="We're creating practice interview questions based on your behavioral interview responses..." 
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
                responses={responses} 
              />
              
              <RelatedPracticesList 
                practices={relatedPractices} 
                isLoading={isLoadingPractices}
                behavioralId={interviewId || ''}
              />
            </CardContent>
            <CardFooter className="flex flex-col justify-center border-t pt-4">
              {!hasRelatedPractice ? (
                <Button
                  className="w-full max-w-md flex items-center gap-2"
                  onClick={handleContinueToQuestions}
                  disabled={isCreatingQuestions}
                >
                  <BookOpen className="w-4 h-4" />
                  {isCreatingQuestions ? 'Generating Questions...' : 'Generate individual practice questions'}
                </Button>
              ) : (
                <div className="w-full max-w-md text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                    <InfoIcon className="w-4 h-4" />
                    <p className="text-sm">Technical questions have already been generated for this interview</p>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    You can view them in the related practices section above
                  </p>
                </div>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
};

export default BehavioralFeedback;
