
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface AnswerPageHeaderProps {
  storylineId: string | null;
}

const AnswerPageHeader: React.FC<AnswerPageHeaderProps> = ({ storylineId }) => {
  return (
    <div className="mb-6">
      <Link to={`/questions?id=${storylineId}`}>
        <Button variant="outline" className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Questions
        </Button>
      </Link>
    </div>
  );
};

export default AnswerPageHeader;
