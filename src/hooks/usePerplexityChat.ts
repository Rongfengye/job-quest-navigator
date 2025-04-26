
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePerplexityChat = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = async (message: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('storyline-perplexity-chat', {
        body: { message }
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error sending message to Perplexity:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message to Perplexity API",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendMessage,
    isLoading
  };
};
