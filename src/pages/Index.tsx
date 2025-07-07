
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
  
  // Debug logging - log all state changes
  useEffect(() => {
    console.log('🔍 Index state debug:', { 
      isAuthenticated, 
      isPasswordRecovery, 
      isLoading,
      showPasswordResetModal,
      currentUrl: window.location.href
    });
  }, [isAuthenticated, isPasswordRecovery, isLoading, showPasswordResetModal]);
  
  // Check for recovery URL parameters and redirect to dedicated page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasRecoveryCode = urlParams.has('code') || window.location.hash.includes('access_token');
    
    console.log('🔗 URL parameter check on Index:', { 
      hasRecoveryCode, 
      urlParams: urlParams.toString(),
      hash: window.location.hash 
    });
    
    if (hasRecoveryCode) {
      console.log('🚨 Recovery code detected on Index, redirecting to recovery page');
      navigate('/recover-password', { replace: true });
      return;
    }
  }, [navigate]);
  
  // If authenticated and NOT in password recovery mode, redirect to behavioral
  if (isAuthenticated && !isPasswordRecovery && !isLoading) {
    console.log('🔄 Redirecting to behavioral - user authenticated and not in recovery');
    return <Navigate to="/behavioral" replace />;
  }

  const handlePasswordResetSuccess = () => {
    console.log('✅ Password reset successful, clearing recovery mode and redirecting');
    setPasswordRecoveryMode(false);
    setShowPasswordResetModal(false);
    
    // Clear URL parameters
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    window.history.replaceState({}, document.title, url.pathname);
    
    navigate('/behavioral');
  };

  const handlePasswordResetModalClose = (open: boolean) => {
    console.log('🔄 Password reset modal close handler:', { open });
    if (!open) {
      console.log('❌ Password reset modal closed by user');
      setShowPasswordResetModal(false);
      // If user cancels password reset, we should still clear recovery mode
      setPasswordRecoveryMode(false);
      
      // Clear URL parameters
      const url = new URL(window.location.href);
      url.search = '';
      url.hash = '';
      window.history.replaceState({}, document.title, url.pathname);
    }
  };
  
  console.log('🎨 Rendering Index page - landing page mode');
  
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
