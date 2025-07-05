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
      updateTokenState(data?.tokens_remaining ?? null);
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

  const togglePremium = async () => {
    if (!user?.id) return;
    
    console.log('🪙 Toggling premium status');
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('toggle_user_premium', {
        user_id: user.id
      });
      
      if (error) throw error;
      
      updateTokenState(data ?? 0);
      const isPremium = data != 0;
      console.log(`✅ Successfully toggled to ${isPremium ? 'premium' : 'basic'}. New status: ${data}`);
      
      toast({
        title: isPremium ? "Upgraded to Premium" : "Downgraded to Basic",
        description: isPremium ? "You now have premium access." : "You're now on the basic plan.",
      });
      
      return { success: true, isPremium, balance: data };
    } catch (error) {
      console.error('Error toggling premium status:', error);
      toast({
        variant: "destructive",
        title: "Error updating plan",
        description: "Could not update your subscription plan."
      });
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  // Keep legacy addTokens function for backward compatibility
  const addTokens = async (amount: number = 10) => {
    if (!user?.id) return;
    
    console.log(`🪙 Adding ${amount} tokens (legacy function)`);
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('add_user_tokens', {
        user_id: user.id,
        amount: amount
      });
      
      if (error) throw error;
      
      updateTokenState(data ?? 0);
      const isPremium = data === 1;
      console.log(`✅ Successfully set status to ${isPremium ? 'premium' : 'basic'}. New balance: ${data}`);
      
      toast({
        title: isPremium ? "Premium activated" : "Plan updated",
        description: isPremium ? "Premium features are now available." : "Your plan has been updated.",
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
    
    // If amount is negative, we're refunding tokens
    const action = amount < 0 ? 'Refunding' : 'Deducting';
    const absAmount = Math.abs(amount);
    
    console.log(`🪙 ${action} ${absAmount} tokens (setting to basic)`);
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('deduct_user_tokens', {
        user_id: user.id,
        amount: amount
      });
      
      if (error) throw error;
      
      // Immediately update the local token state and notify listeners
      updateTokenState(data ?? 0);
      console.log(`✅ Successfully set to basic plan. New balance: ${data}`);
      return { success: true, balance: data };
    } catch (error: any) {
      console.error(`Error ${action.toLowerCase()} tokens:`, error);
      
      // Only show toast for specific token deduction
      if (error.message?.includes('Insufficient tokens')) {
        toast({
          variant: "destructive",
          title: "Operation failed",
          description: "Could not complete the requested action."
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

  // Helper function to check if user is premium
  const isPremium = tokens === 1;
  const isBasic = tokens === 0;

  return {
    tokens,
    isPremium,
    isBasic,
    isLoading,
    fetchTokens,
    togglePremium,
    addTokens, // Legacy function for backward compatibility
    deductTokens,
    subscribeToTokenUpdates
  };
};
