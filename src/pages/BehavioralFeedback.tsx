import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, InfoIcon, Crown } from 'lucide-react';
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
import { usePlanStatus } from '@/hooks/usePlanStatus';
import PremiumNudge from '@/components/PremiumNudge';
import SoftUsageGate from '@/components/SoftUsageGate';

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
  const [canGenerateQuestions, setCanGenerateQuestions] = useState(true);
  const [usageLimitMessage, setUsageLimitMessage] = useState<string>('');
  const [showQuestionVaultGate, setShowQuestionVaultGate] = useState(false);

  const { usageSummary, isLoadingUsage, isPremium, isBasic } = usePlanStatus();

  const interviewId = searchParams.get('id') || location.state?.behavioralId;
  const hasFeedbackInState = !!location.state?.feedback;
  const hasQuestionsInState = !!location.state?.questions && Array.isArray(location.state.questions);
  const hasResponsesInState = !!location.state?.answers && Array.isArray(location.state.answers);

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
      interviewId,
      questions, // Pass the original behavioral questions
      true // skipGeneration: true for entry point B
    );

  // Check usage limits for question vault generation
  useEffect(() => {
    if (isPremium) {
      setCanGenerateQuestions(true);
      setUsageLimitMessage('');
      return;
    }

    if (isBasic && usageSummary && !isLoadingUsage) {
      const remaining = usageSummary.questionVault.remaining;
      if (remaining === 0) {
        setCanGenerateQuestions(false);
        // Don't block with message, use soft gate instead
        setUsageLimitMessage('');
      } else {
        setCanGenerateQuestions(true);
        setUsageLimitMessage('');
      }
    }
  }, [isPremium, isBasic, usageSummary, isLoadingUsage]);

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
    
    // Always fetch from the database, ignore location.state for questions/answers/feedback
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
          
        // Also save responses
        const responsesData = data.responses as any[];
        const processedResponses = Array.isArray(responsesData)
          ? responsesData.map(r => String(r))
          : [];
          
        setQuestions(processedQuestions);
        setResponses(processedResponses);
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

  // Define the function to continue to questions
  function handleContinueToQuestions() {
    if (!interviewData) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Interview data is missing. Cannot continue to questions.",
      });
      return;
    }

    try {
      // The actual resumeFile and other files will be used from the behavioral interview
      // via the behavioralId, and the original questions will be passed via the hook
      submitJobPractice();
    } catch (error) {
      console.error("Error generating practice questions:", error);
      
      // Phase 3: Enhanced error handling - check for specific error types
      if (error.message?.includes('Behavioral interview data not found') || error.message?.includes('returnToFeedback')) {
        toast({
          variant: "destructive",
          title: "Interview Data Not Found",
          description: "Unable to retrieve your behavioral interview questions. Please refresh the page and try again.",
        });
      } else if (error.message?.includes('suggestCreatePage')) {
        toast({
          variant: "destructive",
          title: "No Questions Available",
          description: "No behavioral interview questions found. Please use the Create page instead.",
        });
        navigate('/create');
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to generate practice questions. Please try again."
        });
      }
    }
  }

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
              
              {/* Post-Practice Success Nudge for Basic Users - only show if they have related practices */}
              {isBasic && hasRelatedPractice && (
                <PremiumNudge variant="post-practice-success" className="mt-6" />
              )}
              
              {/* Only show related practices list if there are actually practices to show */}
              {hasRelatedPractice && (
                <RelatedPracticesList 
                  practices={relatedPractices} 
                  isLoading={isLoadingPractices}
                  behavioralId={interviewId || ''}
                />
              )}
            </CardContent>
            <CardFooter className="flex flex-col items-center justify-center border-t pt-6">
              {!hasRelatedPractice ? (
                <>
                  {/* Supporting lead text above CTA */}
                  <div className="text-sm text-gray-600 text-center mb-2 max-w-md">
                    Want to improve your answers?
                  </div>
                  
                  {showQuestionVaultGate && usageSummary ? (
                    <div className="w-full max-w-md">
                      <SoftUsageGate
                        usageType="question_vault"
                        currentCount={usageSummary.questionVault.current}
                        limit={usageSummary.questionVault.limit}
                        onContinue={() => navigate('/settings')}
                        onWaitUntilNextMonth={() => setShowQuestionVaultGate(false)}
                      />
                    </div>
                  ) : (
                    <div className="w-full max-w-md flex flex-col items-center">
                      <Button
                        className="w-full flex items-center justify-center gap-2"
                        size="lg"
                        onClick={(e) => {
                          if (usageSummary && !usageSummary.isPremium && usageSummary.questionVault.remaining === 0) {
                            e.preventDefault();
                            setShowQuestionVaultGate(true);
                            return;
                          }
                          handleContinueToQuestions();
                        }}
                        disabled={isCreatingQuestions}
                      >
                        {isCreatingQuestions ? (
                          <>
                            <BookOpen className="w-4 h-4 animate-spin" />
                            Generating Practice Suite...
                          </>
                        ) : (
                          <>
                            🔁 Click here!
                          </>
                        )}
                      </Button>
                      
                      {/* Subtext under button */}
                      <p className="text-xs text-gray-500 text-center mt-1">
                        Revisit each question, get dynamic follow-up prompts, and receive new feedback — all in one session.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full max-w-md text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                    <InfoIcon className="w-4 h-4" />
                    <p className="text-sm">Practice questions have already been generated for this interview</p>
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
