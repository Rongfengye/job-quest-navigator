
import React from 'react';
import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import Features from '@/components/Features';
import { Separator } from '@/components/ui/separator';
import { useAuthContext } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';

const Index = () => {
  const { isAuthenticated, isLoading } = useAuthContext();
  
  // If authenticated, redirect to behavioral instead of dashboard
  if (isAuthenticated && !isLoading) {
    return <Navigate to="/behavioral" replace />;
  }
  
  // Show landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-50 to-blue-300 flex flex-col">
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Separator className="max-w-5xl mx-auto bg-white/30" />
        <Features />
      </main>
      
      <footer className="py-8 px-6 bg-blue-400/20">
        <div className="max-w-7xl mx-auto text-center text-interview-text-primary text-sm">
          <p>© {new Date().getFullYear()} Storyline. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
