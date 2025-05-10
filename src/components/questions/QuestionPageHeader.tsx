
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface QuestionPageHeaderProps {
  storylineId: string | null;
  behavioralId: string | null;
}

const QuestionPageHeader: React.FC<QuestionPageHeaderProps> = ({ storylineId, behavioralId }) => {
  // Determine if we need to go back to the behavioral feedback page
  const isBehavioralFeedbackSource = !!behavioralId;
  
  return (
    <div className="mb-6">
      {isBehavioralFeedbackSource ? (
        <Link to={`/behavioralFeedback?id=${behavioralId}`}>
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Behavioral Feedback
          </Button>
        </Link>
      ) : (
        <Link to="/">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      )}
    </div>
  );
};

export default QuestionPageHeader;
