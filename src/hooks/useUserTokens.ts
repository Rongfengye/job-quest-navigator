
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuthContext } from '@/context/AuthContext';

export const useUserTokens = () => {
  const [tokens, setTokens] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuthContext();

  const fetchTokens = async () => {
    if (!user) {
      setTokens(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('storyline_user_tokens')
        .select('tokens_remaining')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setTokens(data.tokens_remaining);
    } catch (error) {
      console.error('Error fetching tokens:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load token balance",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTokens = async (amount: number) => {
    if (!user) return;

    try {
      // Using Supabase RPC function to add tokens
      const { data, error } = await supabase.rpc(
        'add_user_tokens',
        { 
          user_id: user.id, 
          amount: amount 
        }
      );

      if (error) throw error;
      setTokens(data);
      
      toast({
        title: "Success",
        description: `Added ${amount} tokens to your balance`,
      });
      
      return data;
    } catch (error) {
      console.error('Error adding tokens:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add tokens",
      });
      return null;
    }
  };

  useEffect(() => {
    fetchTokens();
  }, [user?.id]);

  return { tokens, isLoading, fetchTokens, addTokens };
};
