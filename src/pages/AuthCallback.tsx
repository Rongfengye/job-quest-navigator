
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (hasProcessed || isProcessing) {
        return;
      }

      setIsProcessing(true);
      console.log('🔗 Auth callback page loaded');
      
      try {
        // Check for OAuth errors first
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        if (error) {
          console.error('❌ OAuth error detected:', error, errorDescription);
          toast({
            variant: "destructive",
            title: "Authentication failed",
            description: errorDescription || "There was an error during the sign-in process. Please try again.",
          });
          navigate('/', { replace: true });
          return;
        }

        // Wait a moment for Supabase to process the OAuth callback
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get the current session after OAuth callback
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Error getting session after OAuth callback:', sessionError);
          toast({
            variant: "destructive",
            title: "Authentication failed",
            description: "There was an error completing your sign-in. Please try again.",
          });
          navigate('/', { replace: true });
          return;
        }

        if (data.session) {
          console.log('✅ OAuth session established successfully');
          console.log('🔍 Provider:', data.session.user.app_metadata?.provider);
          console.log('🔍 User metadata:', data.session.user.user_metadata);
          
          const provider = data.session.user.app_metadata?.provider;
          const providerName = provider === 'google' ? 'Google' : 
                             provider === 'github' ? 'GitHub' : 
                             provider === 'linkedin_oidc' ? 'LinkedIn' : 
                             'OAuth';
          
          toast({
            title: "Successfully signed in",
            description: `Welcome! You've been signed in via ${providerName}.`,
          });
          
          // Redirect to behavioral page
          navigate('/behavioral', { replace: true });
        } else {
          console.log('⚠️ No session found after OAuth callback, retrying...');
          
          // Retry once more with longer delay
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const { data: retryData, error: retryError } = await supabase.auth.getSession();
          
          if (retryData.session) {
            console.log('✅ Session established after retry');
            const provider = retryData.session.user.app_metadata?.provider;
            const providerName = provider === 'google' ? 'Google' : 
                               provider === 'github' ? 'GitHub' : 
                               provider === 'linkedin_oidc' ? 'LinkedIn' : 
                               'OAuth';
            
            toast({
              title: "Successfully signed in",
              description: `Welcome! You've been signed in via ${providerName}.`,
            });
            
            navigate('/behavioral', { replace: true });
          } else {
            console.log('❌ Failed to establish session after OAuth');
            toast({
              variant: "destructive",
              title: "Authentication incomplete",
              description: "Your sign-in didn't complete properly. Please try again.",
            });
            navigate('/', { replace: true });
          }
        }
      } catch (error) {
        console.error('❌ Unexpected error in auth callback:', error);
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: "An unexpected error occurred. Please try signing in again.",
        });
        navigate('/', { replace: true });
      } finally {
        setHasProcessed(true);
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, [navigate, toast, hasProcessed, isProcessing]);

  return (
    <div className="min-h-screen bg-sky-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-interview-primary mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-interview-text-primary mb-2">
          Completing sign-in...
        </h2>
        <p className="text-interview-text-secondary">
          Please wait while we finish setting up your account.
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
