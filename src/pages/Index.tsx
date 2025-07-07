
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import Testimonials from '@/components/Testimonials';
import CallToAction from '@/components/CallToAction';
import PasswordResetModal from '@/components/PasswordResetModal';
import { Separator } from '@/components/ui/separator';
import { useAuthContext } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';

const Index = () => {
  const { isAuthenticated, isLoading, isPasswordRecovery, setPasswordRecoveryMode } = useAuthContext();
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const navigate = useNavigate();
  
  // Check for password recovery mode when component mounts or auth state changes
  useEffect(() => {
    if (isAuthenticated && isPasswordRecovery && !isLoading) {
      console.log('User is authenticated and in password recovery mode, showing modal');
      setShowPasswordResetModal(true);
    }
  }, [isAuthenticated, isPasswordRecovery, isLoading]);
  
  // If authenticated and NOT in password recovery mode, redirect to behavioral
  if (isAuthenticated && !isPasswordRecovery && !isLoading) {
    return <Navigate to="/behavioral" replace />;
  }

  const handlePasswordResetSuccess = () => {
    console.log('Password reset successful, clearing recovery mode and redirecting');
    setPasswordRecoveryMode(false);
    setShowPasswordResetModal(false);
    navigate('/behavioral');
  };

  const handlePasswordResetModalClose = (open: boolean) => {
    if (!open) {
      console.log('Password reset modal closed');
      setShowPasswordResetModal(false);
      // If user cancels password reset, we should still clear recovery mode
      setPasswordRecoveryMode(false);
    }
  };
  
  // Show landing page for non-authenticated users or users in password recovery mode
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1">
        {/* Continuous gradient background for Hero and How It Works sections */}
        <div className="bg-sky-50">
          <Hero />
          {/* Subtle separator line between Hero and How It Works with 50px spacing */}
          <div className="flex justify-center px-6 py-12">
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
      
      <footer className="py-16 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-interview-text-primary mb-4">
            Need help with your resume or LinkedIn too?
          </h2>
          <p className="text-interview-text-secondary text-lg mb-8">
            Check out{' '}
            <a 
              href="https://www.linkedup.tryhireme.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-interview-primary hover:text-interview-dark font-semibold transition-colors"
            >
              LinkedUp
            </a>
            {' '}and{' '}
            <a 
              href="https://www.resubuild.tryhireme.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-interview-primary hover:text-interview-dark font-semibold transition-colors"
            >
              ResuBuild
            </a>
            {' '}— designed by the same team.
          </p>
          <p className="text-interview-text-light text-sm">
            © {new Date().getFullYear()} Storyline. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Password Reset Modal - shown when user is in password recovery mode */}
      <PasswordResetModal
        open={showPasswordResetModal}
        onOpenChange={handlePasswordResetModalClose}
        onSuccess={handlePasswordResetSuccess}
      />
    </div>
  );
};

export default Index;
