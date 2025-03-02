
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const NoQuestions: React.FC = () => {
  return (
    <div className="bg-gray-100 rounded-lg p-8 text-center">
      <h2 className="text-xl font-semibold mb-4">Questions Not Available</h2>
      <p className="text-gray-600 mb-4">
        We couldn't find any interview questions for this job application.
        This could be because they're still being generated or there was an error.
      </p>
      <Link to="/create">
        <Button>Create New Interview Prep</Button>
      </Link>
    </div>
  );
};

export default NoQuestions;
