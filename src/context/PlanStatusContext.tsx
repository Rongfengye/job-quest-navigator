
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
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
  
  // Debouncing refs
  const updateDebounceTimeout = useRef<number | undefined>(undefined);
  const isUnmounting = useRef<boolean>(false);
  
  // Debounce configuration
  const UPDATE_DEBOUNCE_DELAY = 300; // 300ms debounce delay

  // Debounced update local state to prevent UI flicker
  const updateTokenState = useCallback((newPlanStatus: number | null) => {
    if (isUnmounting.current) return;
    
    // Clear any existing debounce timeout
    if (updateDebounceTimeout.current) {
      clearTimeout(updateDebounceTimeout.current);
    }
    
    // Debounce the update to prevent rapid-fire changes
    updateDebounceTimeout.current = window.setTimeout(() => {
      if (!isUnmounting.current) {
        console.log('✅ Plan status context updating to:', newPlanStatus);
        setTokens(newPlanStatus);
      }
    }, UPDATE_DEBOUNCE_DELAY);
  }, []);

  const fetchTokens = useCallback(async () => {
    if (!user?.id || isUnmounting.current) return;
    
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
      if (!isUnmounting.current) {
        toast({
          variant: "destructive",
          title: "Error fetching plan status",
          description: "Could not retrieve your subscription status."
        });
      }
    } finally {
      if (!isUnmounting.current) {
        setIsLoading(false);
      }
    }
  }, [user?.id, toast, updateTokenState]);

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up plan status context');
    isUnmounting.current = true;
    
    // Clear debounce timeout
    if (updateDebounceTimeout.current) {
      clearTimeout(updateDebounceTimeout.current);
      updateDebounceTimeout.current = undefined;
    }
  }, []);

  // Simple effect for initial token fetch on authentication
  useEffect(() => {
    isUnmounting.current = false;
    
    if (!isAuthenticated || !user?.id) {
      console.log('🚫 User not authenticated - skipping token fetch');
      setTokens(null);
      return;
    }
    
    // Initial fetch when user is authenticated
    console.log('👤 User authenticated - fetching initial plan status');
    fetchTokens();
    
    return cleanup;
  }, [isAuthenticated, user?.id, fetchTokens, cleanup]);

  const togglePremium = async () => {
    if (!user?.id || isUnmounting.current) return { success: false, error: 'Not authenticated' };
    
    console.log('🪙 Toggling premium status (context)');
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('toggle_user_premium', {
        user_id: user.id
      });
      
      if (error) throw error;
      
      // Optimistically update the UI immediately
      updateTokenState(data ?? 0);
      const isPremium = checkIsPremium(data);
      console.log(`✅ Successfully toggled to ${isPremium ? 'premium' : 'basic'}. New status: ${data}`);
      
      if (!isUnmounting.current) {
        toast({
          title: isPremium ? "Upgraded to Premium" : "Downgraded to Basic",
          description: isPremium ? "You now have premium access." : "You're now on the basic plan.",
        });
      }
      
      return { success: true, isPremium, balance: data };
    } catch (error) {
      console.error('Error toggling premium status:', error);
      if (!isUnmounting.current) {
        toast({
          variant: "destructive",
          title: "Error updating plan",
          description: "Could not update your subscription plan."
        });
      }
      return { success: false, error };
    } finally {
      if (!isUnmounting.current) {
        setIsLoading(false);
      }
    }
  };

  // Helper function to check if user is premium
  const isPremium = checkIsPremium(tokens);
  const isBasic = !isPremium;

  const value: PlanStatusContextType = {
    tokens,
    isPremium,
    isBasic,
    isLoading,
    fetchTokens,
    togglePremium
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
