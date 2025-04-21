
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const InterviewHeader = () => {
  const navigate = useNavigate();
  
  return (
    <div className="mb-8 flex justify-between items-center">
      <Button 
        variant="outline" 
        className="flex items-center gap-2"
        onClick={() => navigate('/behavioral')}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>
    </div>
  );
};

export default InterviewHeader;
