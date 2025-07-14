
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
      
      // Check if we have a valid session for authenticated users
      if (!session?.access_token && user) {
        console.log('❌ No valid session for authenticated user');
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: "Please log in again to submit feedback.",
        });
        return false;
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

      // Construct metadata object
      const feedbackMetadata = {
        website: 'storyline',
        text: formData.feedback,
        email: formData.email || (user ? 'authenticated_user' : ''),
        page: window.location.pathname,
        timestamp: new Date().toISOString()
      };

      // Stringify the metadata object
      const feedback_string = JSON.stringify(feedbackMetadata);

      console.log('📝 Constructed feedback metadata:', { ...feedbackMetadata, text: '[REDACTED]' });

      const { data, error } = await supabase.functions.invoke('hireme_feedback_edge', {
        body: {
          feedback_string,
          email: formData.email,
        },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`,
        } : undefined,
      });

      if (error) {
        throw new Error(error.message || 'Failed to submit feedback');
      }

      const result: FeedbackSubmissionResponse = data;

      if (result.success) {
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
