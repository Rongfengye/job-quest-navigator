
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FeedbackOverview from '@/components/answer/FeedbackOverview';
import { useToast } from '@/hooks/use-toast';

const BehavioralFeedback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { feedback, questions, answers } = location.state || { feedback: [], questions: [], answers: [] };

  // Log what we received to better understand the structure
  useEffect(() => {
    console.log('BehavioralFeedback page received state:', {
      hasState: !!location.state,
      feedbackData: feedback,
      questionsData: questions,
      answersData: answers
    });
    
    if (!location.state || !questions || questions.length === 0) {
      console.error('Missing required data for feedback page:', { 
        hasState: !!location.state,
        questionsLength: questions?.length
      });
      
      toast({
        variant: "destructive",
        title: "Missing feedback data",
        description: "Could not load feedback. Returning to interview page.",
      });
      
      // Add a slight delay before navigating to ensure the toast is seen
      setTimeout(() => {
        navigate('/behavioral');
      }, 2000);
    }
  }, [location.state, feedback, questions, answers, navigate, toast]);

  // Show a loading state while checking data
  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading feedback data...</h2>
          <p className="text-gray-500">If this takes too long, please return to the interview page.</p>
          <Button 
            className="mt-4" 
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
    <div className="min-h-screen bg-white p-6">
      <div className="w-full max-w-4xl mx-auto">
        <div className="mb-8">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => navigate('/behavioral')}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Interview
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Interview Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <FeedbackOverview 
              feedback={answers} 
              questions={questions} 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BehavioralFeedback;
