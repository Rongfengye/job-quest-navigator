import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface QuestionPageHeaderProps {
  behavioralId: string | null;
}

const QuestionPageHeader: React.FC<QuestionPageHeaderProps> = ({ behavioralId }) => {
  // If we have a behavioral ID, we link back to the behavioral feedback page
  // Otherwise, we link back to the home page
  const linkTo = behavioralId ? `/behavioralFeedback?id=${behavioralId}` : '/';
  const buttonText = behavioralId ? 'Back to Behavioral Feedback' : 'Back to Home';

  return (
    <div className="mb-6">
      <Link to={linkTo}>
        <Button variant="outline" className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          {buttonText}
        </Button>
      </Link>
    </div>
  );
};

export default QuestionPageHeader;
