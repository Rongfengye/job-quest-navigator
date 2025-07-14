
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
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if user is authenticated
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
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
