
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FeedbackOverview from '@/components/answer/FeedbackOverview';

const BehavioralFeedback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { feedback, questions, answers } = location.state || { feedback: [], questions: [], answers: [] };

  if (!feedback || !questions || !answers) {
    navigate('/behavioral');
    return null;
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
            <FeedbackOverview feedback={feedback} questions={questions} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BehavioralFeedback;
