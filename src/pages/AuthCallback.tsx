
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('🔗 Auth callback page loaded');
      
      try {
        // Get the current session after OAuth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session after OAuth callback:', error);
          toast({
            variant: "destructive",
            title: "Authentication failed",
            description: "There was an error completing your sign-in. Please try again.",
          });
          navigate('/');
          return;
        }

        if (data.session) {
          console.log('✅ OAuth session established successfully');
          console.log('🔍 Provider:', data.session.user.app_metadata?.provider);
          
          toast({
            title: "Successfully signed in",
            description: `Welcome! You've been signed in via ${data.session.user.app_metadata?.provider || 'OAuth'}.`,
          });
          
          // Redirect to behavioral page
          navigate('/behavioral');
        } else {
          console.log('⚠️ No session found after OAuth callback');
          toast({
            variant: "destructive",
            title: "Authentication incomplete",
            description: "Your sign-in didn't complete properly. Please try again.",
          });
          navigate('/');
        }
      } catch (error) {
        console.error('❌ Unexpected error in auth callback:', error);
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: "An unexpected error occurred. Please try signing in again.",
        });
        navigate('/');
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

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
