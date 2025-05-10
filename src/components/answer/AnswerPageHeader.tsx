
import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface AnswerPageHeaderProps {
  storylineId: string | null;
}

const AnswerPageHeader: React.FC<AnswerPageHeaderProps> = ({ storylineId }) => {
  const [searchParams] = useSearchParams();
  const behavioralId = searchParams.get('behavioralId');
  
  // If there's a behavioralId in the URL params, we need to pass it along
  const questionPageUrl = behavioralId 
    ? `/questions?id=${storylineId}&behavioralId=${behavioralId}` 
    : `/questions?id=${storylineId}`;

  return (
    <div className="mb-6">
      <Link to={questionPageUrl}>
        <Button variant="outline" className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Questions
        </Button>
      </Link>
    </div>
  );
};

export default AnswerPageHeader;
