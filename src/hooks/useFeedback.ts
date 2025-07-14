
import { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { FeedbackFormData, FeedbackSubmissionResponse } from '@/types/feedback';

export const useFeedback = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthContext();
  const { toast } = useToast();

  const submitFeedback = async (formData: FeedbackFormData): Promise<boolean> => {
    setIsSubmitting(true);
    
    try {
      // Get the session token for authenticated users
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('🔍 Feedback submission debug:', {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        sessionError,
        userAuthenticated: !!user,
        formData: { ...formData, feedback: '[REDACTED]' }
      });
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Only add authorization header if we have a valid session with access token
      // and no session errors (to avoid sending expired/invalid tokens)
      if (session?.access_token && !sessionError && user) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
        console.log('✅ Adding Authorization header for authenticated user');
      } else if (!user && !formData.email) {
        // For anonymous users, email is required
        toast({
          variant: "destructive",
          title: "Email required",
          description: "Please provide your email address for anonymous feedback.",
        });
        return false;
      } else {
        console.log('📧 Submitting as anonymous user with email');
      }

      const response = await fetch(
        'https://qrpppkxwvmngepzznorf.supabase.co/functions/v1/hireme_feedback_edge',
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            feedback_string: formData.feedback,
            email: formData.email,
          }),
        }
      );

      const result: FeedbackSubmissionResponse = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Feedback submitted!",
          description: "Thank you for your feedback. We appreciate it!",
        });
        return true;
      } else {
        throw new Error(result.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        variant: "destructive",
        title: "Failed to submit feedback",
        description: "Please try again later or contact support.",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitFeedback,
    isSubmitting,
    isAuthenticated: !!user,
  };
};
