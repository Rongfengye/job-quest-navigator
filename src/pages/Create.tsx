
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Create = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-3xl mx-auto text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-interview-primary">
          Create Interview Prep Material
        </h1>
        <p className="text-interview-text-secondary mb-8">
          Let's prepare you for success! We'll help you craft personalized interview questions based on your experience and target role.
        </p>
        <Link to="/">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Create;
