
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuthContext } from '@/context/AuthContext';

export const useUserTokens = () => {
  const [tokens, setTokens] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuthContext();

  const fetchTokens = useCallback(async () => {
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
  }, [user?.id, toast]);

  const addTokens = async (amount: number = 10) => {
    if (!user?.id) return;
    
    console.log(`🪙 Adding ${amount} tokens`);
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('add_user_tokens', {
        user_id: user.id,
        amount: amount
      });
      
      if (error) throw error;
      
      setTokens(data ?? 0);
      console.log(`✅ Successfully added ${amount} tokens. New balance: ${data}`);
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
    
    console.log(`🪙 Deducting ${amount} tokens`);
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('deduct_user_tokens', {
        user_id: user.id,
        amount: amount
      });
      
      if (error) throw error;
      
      // Immediately update the local token state
      setTokens(data ?? 0);
      console.log(`✅ Successfully deducted ${amount} tokens. New balance: ${data}`);
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

  // Set up real-time subscription to token changes
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    
    // Initial fetch
    fetchTokens();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('token-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'storyline_user_tokens',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Refresh tokens whenever there's a change
          fetchTokens();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, user?.id, fetchTokens]);

  return {
    tokens,
    isLoading,
    fetchTokens,
    addTokens,
    deductTokens
  };
};
