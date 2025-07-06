import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { filterValue } from '@/utils/supabaseTypes';

interface PlanStatusContextType {
  tokens: number | null;
  isPremium: boolean;
  isBasic: boolean;
  isLoading: boolean;
  fetchTokens: () => Promise<void>;
  togglePremium: () => Promise<{ success: boolean; isPremium?: boolean; balance?: number; error?: any }>;
  addTokens: (amount?: number) => Promise<{ success: boolean; balance?: number; error?: any }>;
  deductTokens: (amount: number) => Promise<{ success: boolean; balance?: number; error?: any }>;
}

const PlanStatusContext = createContext<PlanStatusContextType | undefined>(undefined);

// Helper function to check if user is premium (1 = premium, 0 = basic)
const checkIsPremium = (planStatus: number | null): boolean => {
  return planStatus === 1;
};

interface PlanStatusProviderProps {
  children: ReactNode;
}

export const PlanStatusProvider: React.FC<PlanStatusProviderProps> = ({ children }) => {
  const [tokens, setTokens] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuthContext();

  // Update local state
  const updateTokenState = useCallback((newPlanStatus: number | null) => {
    console.log('✅ Plan status context updating to:', newPlanStatus);
    setTokens(newPlanStatus);
  }, []);

  const fetchTokens = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('hireme_user_status')
        .select('user_plan_status')
        .eq('user_id', filterValue(user.id))
        .maybeSingle();
      
      if (error) throw error;
      
      console.log('📊 Plan status fetched from database (context):', data?.user_plan_status);
      updateTokenState(data?.user_plan_status ?? null);
    } catch (error) {
      console.error('Error fetching user plan status:', error);
      toast({
        variant: "destructive",
        title: "Error fetching plan status",
        description: "Could not retrieve your subscription status."
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, toast, updateTokenState]);

  const togglePremium = async () => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };
    
    console.log('🪙 Toggling premium status (context)');
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('toggle_user_premium', {
        user_id: user.id
      });
      
      if (error) throw error;
      
      updateTokenState(data ?? 0);
      const isPremium = checkIsPremium(data);
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
    if (!user?.id) return { success: false, error: 'Not authenticated' };
    
    console.log(`🪙 Adding ${amount} tokens (legacy function - context)`);
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('add_user_tokens', {
        user_id: user.id,
        amount: amount
      });
      
      if (error) throw error;
      
      updateTokenState(data ?? 0);
      const isPremium = checkIsPremium(data);
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
    
    console.log(`🪙 ${action} ${absAmount} tokens (setting to basic - context)`);
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('deduct_user_tokens', {
        user_id: user.id,
        amount: amount
      });
      
      if (error) throw error;
      
      // Immediately update the local token state
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

  // Set up the single WebSocket subscription for real-time updates
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    
    console.log('🔄 Setting up centralized WebSocket subscription for plan status');
    
    // Initial fetch
    fetchTokens();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('plan-status-global')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hireme_user_status',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 Realtime update received for plan status (context):', payload);
          // Refresh tokens whenever there's a change
          fetchTokens();
        }
      )
      .subscribe();
    
    return () => {
      console.log('🔄 Cleaning up centralized WebSocket subscription');
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, user?.id, fetchTokens]);

  // Helper function to check if user is premium
  const isPremium = checkIsPremium(tokens);
  const isBasic = !isPremium;

  const value: PlanStatusContextType = {
    tokens,
    isPremium,
    isBasic,
    isLoading,
    fetchTokens,
    togglePremium,
    addTokens,
    deductTokens
  };

  return (
    <PlanStatusContext.Provider value={value}>
      {children}
    </PlanStatusContext.Provider>
  );
};

// Custom hook to use the plan status context
export const usePlanStatus = (): PlanStatusContextType => {
  const context = useContext(PlanStatusContext);
  if (context === undefined) {
    throw new Error('usePlanStatus must be used within a PlanStatusProvider');
  }
  return context;
};
