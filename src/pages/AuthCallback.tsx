
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
        const type = urlParams.get('type');
        
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

        // Check if this is an email confirmation
        if (type === 'signup') {
          console.log('📧 Email confirmation detected');
          
          // Wait a moment for Supabase to process the confirmation
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { data, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('❌ Error getting session after email confirmation:', sessionError);
            toast({
              variant: "destructive",
              title: "Email confirmation failed",
              description: "There was an error confirming your email. Please try again.",
            });
            navigate('/', { replace: true });
            return;
          }

          if (data.session) {
            console.log('✅ Email confirmed and session established');
            toast({
              title: "Email confirmed!",
              description: "Your account has been successfully verified.",
            });
            
            // Redirect to welcome page for new users
            navigate('/welcome', { replace: true });
            return;
          }
        }

        // Handle OAuth callbacks
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
          const user = data.session.user;
          // Check if user has any behavioral interview rows
          const { data: behaviorals, error: behavioralsError } = await supabase
            .from('storyline_behaviorals')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);

          if (behavioralsError) {
            console.error('❌ Error checking behavioral interviews:', behavioralsError);
            toast({
              variant: "destructive",
              title: "Error",
              description: "There was an error checking your account. Please try again.",
            });
            navigate('/', { replace: true });
            return;
          }

          if (!behaviorals || behaviorals.length === 0) {
            // New user: show welcome
            navigate('/welcome', { replace: true });
          } else {
            // Returning user: go to behavioral
            navigate('/behavioral', { replace: true });
          }
          return;
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
            
            navigate('/welcome', { replace: true });
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
