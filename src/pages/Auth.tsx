
import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import AuthForm from '@/components/auth/AuthForm';
import { useAuth } from '@/hooks/useAuth';

const Auth = () => {
  const { user, isLoading } = useAuth();

  // If user is already logged in, redirect to create page
  if (!isLoading && user) {
    return <Navigate to="/create" replace />;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-6">
      <div className="w-full max-w-3xl mx-auto">
        <div className="mb-8">
          <Link to="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-interview-primary text-center">
          Welcome to Storyline
        </h1>
        
        <div className="mt-8">
          <AuthForm />
        </div>
      </div>
    </div>
  );
};

export default Auth;
