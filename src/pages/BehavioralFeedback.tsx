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
import { useUserTokens } from '@/hooks/useUserTokens';

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

  const { usageSummary, isLoadingUsage, isPremium, isBasic, checkUsageLimit, syncSubscriptionStatus } = useUserTokens();

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
      questions // Pass the original behavioral questions
    );

  // Enhanced usage limits check with Stripe verification for question vault generation
  useEffect(() => {
    const checkUsageLimitsWithSync = async () => {
      console.log('🔄 Syncing subscription status before checking question vault limits...');
      
      if (isPremium) {
        setCanGenerateQuestions(true);
        setUsageLimitMessage('');
        return;
      }

      if (isBasic && !isLoadingUsage) {
        try {
          const usageCheck = await checkUsageLimit('question_vault');
          setCanGenerateQuestions(usageCheck.canProceed);
          
          if (!usageCheck.canProceed) {
            setUsageLimitMessage(usageCheck.message || 'You\'ve reached your monthly limit for question vault generations. Upgrade to Premium for unlimited access.');
          } else {
            setUsageLimitMessage('');
          }
        } catch (error) {
          console.error('Error checking question vault usage limits:', error);
          setCanGenerateQuestions(false);
          setUsageLimitMessage('Unable to verify usage limits. Please try again.');
        }
      }
    };

    checkUsageLimitsWithSync();
  }, [isPremium, isBasic, isLoadingUsage, checkUsageLimit]);

  // Sync subscription status on component mount
  useEffect(() => {
    console.log('🔄 Syncing subscription status on BehavioralFeedback page load...');
    syncSubscriptionStatus();
  }, [syncSubscriptionStatus]);

  // Enhanced function to continue to questions with usage verification
  async function handleContinueToQuestions() {
    if (!interviewData) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Interview data is missing. Cannot continue to questions.",
      });
      return;
    }

    try {
      // Double-check usage limits before proceeding
      console.log('🔍 Final usage check before generating questions...');
      const usageCheck = await checkUsageLimit('question_vault');
      
      if (!usageCheck.canProceed) {
        toast({
          variant: "destructive",
          title: "Usage Limit Reached",
          description: usageCheck.message || "You've reached your limit for question vault generations.",
        });
        return;
      }

      // The actual resumeFile and other files will be used from the behavioral interview
      // via the behavioralId, and the original questions will be passed via the hook
      submitJobPractice();
    } catch (error) {
      console.error("Error generating technical questions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate technical questions. Please try again."
      });
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
              
              <RelatedPracticesList 
                practices={relatedPractices} 
                isLoading={isLoadingPractices}
                behavioralId={interviewId || ''}
              />
            </CardContent>
            <CardFooter className="flex flex-col justify-center border-t pt-4">
              {!hasRelatedPractice ? (
                canGenerateQuestions ? (
                  <Button
                    className="w-full max-w-md flex items-center gap-2"
                    onClick={handleContinueToQuestions}
                    disabled={isCreatingQuestions}
                  >
                    <BookOpen className="w-4 h-4" />
                    {isCreatingQuestions ? 'Generating Questions...' : 'Generate individual practice questions'}
                  </Button>
                ) : (
                  <div className="w-full max-w-md">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-orange-800 mb-2">
                        <Crown className="h-4 w-4" />
                        <span className="font-medium">Usage Limit Reached</span>
                      </div>
                      <p className="text-sm text-orange-700 mb-3">
                        {usageLimitMessage}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/settings')}
                        className="border-orange-300 text-orange-700 hover:bg-orange-100"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade to Premium
                      </Button>
                    </div>
                  </div>
                )
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
