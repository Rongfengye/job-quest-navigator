
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import Testimonials from '@/components/Testimonials';
import CallToAction from '@/components/CallToAction';
// import PasswordResetModal from '@/components/PasswordResetModal'; // Commented out for OAuth-only flow
import { Separator } from '@/components/ui/separator';
import { useAuthContext } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { logger } from '@/lib/logger';

const Index = () => {
  const { isAuthenticated, isLoading } = useAuthContext();
  // Password recovery commented out for OAuth-only flow
  // const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const navigate = useNavigate();
  
  // Debug logging - log all state changes
  useEffect(() => {
    logger.debug('Index state debug', { 
      isAuthenticated, 
      isLoading,
      // showPasswordResetModal, // Commented out for OAuth-only flow
      currentUrl: window.location.href
    });
  }, [isAuthenticated, isLoading]);
  
  // OAuth callback handling only (password recovery commented out for OAuth-only flow)
  /*
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    // Check for OAuth callback parameters first
    const hasOAuthCode = urlParams.get('code') && (urlParams.get('state') || hashParams.get('access_token'));
    const hasOAuthError = urlParams.get('error');
    
    // Only treat as recovery if it's specifically a password recovery flow
    const hasRecoveryCode = urlParams.has('type') && urlParams.get('type') === 'recovery' && urlParams.has('code');
    
    console.log('🔗 URL parameter check on Index:', { 
      hasOAuthCode,
      hasOAuthError,
      hasRecoveryCode, 
      urlParams: urlParams.toString(),
      hash: window.location.hash 
    });
    
    // Don't interfere with OAuth callbacks
    if (hasOAuthCode || hasOAuthError) {
      console.log('🔗 OAuth callback detected on Index, letting AuthCallback handle it');
      return;
    }
    
    if (hasRecoveryCode) {
      console.log('🚨 Recovery code detected on Index, redirecting to recovery page');
      navigate('/recover-password', { replace: true });
      return;
    }
  }, [navigate]);
  */
  
  // If authenticated, redirect to behavioral (password recovery disabled for OAuth-only flow)
  if (isAuthenticated && !isLoading) {
    logger.debug('Redirecting to behavioral - user authenticated');
    return <Navigate to="/behavioral" replace />;
  }

  // Password reset handlers commented out for OAuth-only flow
  /*
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
  */
  
  logger.debug('Rendering Index page - landing page mode');
  
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

      {/* Password Reset Modal commented out for OAuth-only flow */}
      {/*
      <PasswordResetModal
        open={showPasswordResetModal}
        onOpenChange={handlePasswordResetModalClose}
        onSuccess={handlePasswordResetSuccess}
      />
      */}
    </div>
  );
};

export default Index;
