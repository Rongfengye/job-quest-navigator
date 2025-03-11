
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuthContext } from '@/context/AuthContext';

export const useUserTokens = () => {
  const [tokens, setTokens] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuthContext();

  const fetchTokens = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('storyline_user_tokens')
        .select('tokens_remaining')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      setTokens(data?.tokens_remaining ?? null);
    } catch (error) {
      console.error('Error fetching user tokens:', error);
      toast({
        variant: "destructive",
        title: "Error fetching tokens",
        description: "Could not retrieve your token balance."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTokens = async (amount: number = 10) => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('add_user_tokens', {
        user_id: user.id,
        amount: amount
      });
      
      if (error) throw error;
      
      setTokens(data ?? 0);
      toast({
        title: "Tokens added",
        description: `${amount} tokens have been added to your account.`
      });
      
      return { success: true, balance: data };
    } catch (error) {
      console.error('Error adding tokens:', error);
      toast({
        variant: "destructive",
        title: "Error adding tokens",
        description: "Could not add tokens to your account."
      });
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  const deductTokens = async (amount: number) => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('deduct_user_tokens', {
        user_id: user.id,
        amount: amount
      });
      
      if (error) throw error;
      
      setTokens(data ?? 0);
      return { success: true, balance: data };
    } catch (error: any) {
      console.error('Error deducting tokens:', error);
      
      // Only show toast for specific token deduction
      if (error.message?.includes('Insufficient tokens')) {
        toast({
          variant: "destructive",
          title: "Insufficient tokens",
          description: "You don't have enough tokens for this action."
        });
      }
      
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTokens();
    } else {
      setTokens(null);
    }
  }, [isAuthenticated, user?.id]);

  return {
    tokens,
    isLoading,
    fetchTokens,
    addTokens,
    deductTokens
  };
};
