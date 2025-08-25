import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface QuestionPageHeaderProps {
  behavioralId: string | null;
}

const QuestionPageHeader: React.FC<QuestionPageHeaderProps> = ({ behavioralId }) => {
  // Always navigate back to the dashboard for all question vault sessions
  const linkTo = '/dashboard';
  const buttonText = 'Back to Dashboard';

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
