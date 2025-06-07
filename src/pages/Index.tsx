
import React from 'react';
import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import Testimonials from '@/components/Testimonials';
import CallToAction from '@/components/CallToAction';
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
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1">
        {/* Continuous gradient background for Hero and How It Works sections */}
        <div className="bg-sky-50">
          <Hero />
          {/* Subtle separator line between Hero and How It Works */}
          <div className="flex justify-center px-6">
            <div className="w-full max-w-4xl">
              <Separator className="bg-gray-300/40" />
            </div>
          </div>
          <HowItWorks />
        </div>
        <Separator className="max-w-5xl mx-auto" />
        <Testimonials />
        <CallToAction />
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
