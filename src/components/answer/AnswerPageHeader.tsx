
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface AnswerPageHeaderProps {
  storylineId: string | null;
}

const AnswerPageHeader: React.FC<AnswerPageHeaderProps> = ({ storylineId }) => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    if (!storylineId) {
      navigate('/');
      return;
    }
    navigate(`/questions?id=${storylineId}`);
  };

  return (
    <div className="mb-6">
      <Button 
        variant="outline" 
        className="flex items-center gap-2"
        onClick={handleBack}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Questions
      </Button>
    </div>
  );
};

export default AnswerPageHeader;
