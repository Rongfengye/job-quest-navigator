
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuthContext } from '@/context/AuthContext';
import { filterValue, safeDatabaseData } from '@/utils/supabaseTypes';

// Create a simple event emitter for token updates
type TokenUpdateListener = (tokens: number | null) => void;
const tokenListeners: Set<TokenUpdateListener> = new Set();

const notifyTokenListeners = (tokens: number | null) => {
  console.log('🔔 Notifying all token listeners of new token balance:', tokens);
  tokenListeners.forEach(listener => listener(tokens));
};

export const useUserTokens = () => {
  const [tokens, setTokens] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuthContext();

  // Update local state and notify all listeners
  const updateTokenState = useCallback((newTokens: number | null) => {
    console.log('✅ Updating token state to:', newTokens);
    setTokens(newTokens);
    notifyTokenListeners(newTokens);
  }, []);

  const fetchTokens = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('storyline_user_tokens')
        .select('tokens_remaining')
        .eq('user_id', filterValue(user.id))
        .maybeSingle();
      
      if (error) throw error;
      
      console.log('📊 Tokens fetched from database:', data?.tokens_remaining);
      
      // Safely access data using our utility function
      const tokensRemaining = data?.tokens_remaining ?? null;
      updateTokenState(tokensRemaining);
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
  }, [user?.id, toast, updateTokenState]);

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
      
      // Safely cast RPC return value to number
      const newBalance = data !== null ? Number(data) : 0;
      updateTokenState(newBalance);
      console.log(`✅ Successfully added ${amount} tokens. New balance: ${newBalance}`);
      toast({
        title: "Tokens added",
        description: `${amount} tokens have been added to your account.`
      });
      
      return { success: true, balance: newBalance };
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
    
    // If amount is negative, we're refunding tokens
    const action = amount < 0 ? 'Refunding' : 'Deducting';
    const absAmount = Math.abs(amount);
    
    console.log(`🪙 ${action} ${absAmount} tokens`);
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('deduct_user_tokens', {
        user_id: user.id,
        amount: amount
      });
      
      if (error) throw error;
      
      // Safely cast RPC return value to number
      const newBalance = data !== null ? Number(data) : 0;
      
      // Immediately update the local token state and notify listeners
      updateTokenState(newBalance);
      console.log(`✅ Successfully ${action.toLowerCase()} ${absAmount} tokens. New balance: ${newBalance}`);
      return { success: true, balance: newBalance };
    } catch (error: any) {
      console.error(`Error ${action.toLowerCase()} tokens:`, error);
      
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

  // Subscribe to token updates
  const subscribeToTokenUpdates = useCallback(() => {
    console.log('🔔 Component subscribing to token updates');
    
    // Create a listener that will update this component's state
    const listener = (newTokens: number | null) => {
      console.log('🔄 Token listener called with new balance:', newTokens);
      setTokens(newTokens);
    };
    
    // Add the listener to our set
    tokenListeners.add(listener);
    
    // Return an unsubscribe function
    return () => {
      console.log('🔔 Component unsubscribing from token updates');
      tokenListeners.delete(listener);
    };
  }, []);

  // Set up real-time subscription to token changes from database
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
        (payload) => {
          console.log('🔄 Realtime update received for tokens:', payload);
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
    deductTokens,
    subscribeToTokenUpdates
  };
};
