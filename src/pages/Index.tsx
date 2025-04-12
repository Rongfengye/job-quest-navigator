
import React from 'react';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import { Separator } from '@/components/ui/separator';
import { useAuthContext } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';

const Index = () => {
  const { isAuthenticated, isLoading } = useAuthContext();
  
  // If authenticated, redirect to dashboard
  if (isAuthenticated && !isLoading) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Show landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1">
        <Hero />
        <Separator className="max-w-5xl mx-auto" />
        <Features />
      </main>
      
      <footer className="py-8 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto text-center text-interview-text-light text-sm">
          <p>© {new Date().getFullYear()} Storyline. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
