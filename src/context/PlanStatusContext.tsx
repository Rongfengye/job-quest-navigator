
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { filterValue } from '@/utils/supabaseTypes';

interface UsageData {
  current: number;
  limit: number;
  remaining: number;
}

interface UsageSummary {
  isPremium: boolean;
  behavioral: UsageData;
  questionVault: UsageData;
}

interface UsageCheckResult {
  canProceed: boolean;
  isPremium: boolean;
  currentCount: number;
  limit: number;
  remaining: number;
  message?: string;
}

interface PlanStatusContextType {
  tokens: number | null;
  isPremium: boolean;
  isBasic: boolean;
  isLoading: boolean;
  usageSummary: UsageSummary | null;
  isLoadingUsage: boolean;
  fetchUserStatus: () => Promise<void>;
  fetchUsageSummary: () => Promise<void>;
  checkUsageLimit: (usageType: 'behavioral' | 'question_vault') => Promise<{ canProceed: boolean; message?: string }>;
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
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuthContext();

  const fetchUserStatus = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('hireme_user_status')
        .select('user_plan_status')
        .eq('user_id', filterValue(user.id))
        .maybeSingle();
      
      if (error) throw error;
      
      console.log('📊 Plan status fetched from database:', data?.user_plan_status);
      setTokens(data?.user_plan_status ?? null);
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
  }, [user?.id, toast]);

  const fetchUsageSummary = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoadingUsage(true);
    try {
      const { data, error } = await supabase.rpc('get_user_monthly_usage_summary', {
        user_id: user.id
      });
      
      if (error) throw error;
      
      console.log('📈 Usage summary fetched:', data);
      setUsageSummary(data as UsageSummary);
    } catch (error) {
      console.error('Error fetching usage summary:', error);
      toast({
        variant: "destructive",
        title: "Error fetching usage data",
        description: "Could not retrieve your usage information."
      });
    } finally {
      setIsLoadingUsage(false);
    }
  }, [user?.id, toast]);

  const checkUsageLimit = useCallback(async (usageType: 'behavioral' | 'question_vault') => {
    if (!user?.id) {
      return { canProceed: false, message: 'Authentication required' };
    }
    
    try {
      const { data, error } = await supabase.rpc('check_user_monthly_usage', {
        user_id: user.id,
        usage_type: usageType
      });
      
      if (error) throw error;
      
      const result = data as UsageCheckResult;
      
      if (!result.canProceed) {
        const usageTypeLabel = usageType === 'behavioral' ? 'behavioral interview practices' : 'question vault generations';
        const message = result.isPremium 
          ? 'An error occurred while checking your usage limits.'
          : `You've reached your monthly limit of ${result.limit} ${usageTypeLabel}. Upgrade to Premium for unlimited access.`;
        
        return { canProceed: false, message };
      }
      
      return { canProceed: true };
    } catch (error) {
      console.error('Error checking usage limit:', error);
      return { canProceed: false, message: 'Failed to check usage limits. Please try again.' };
    }
  }, [user?.id]);

  // Only fetch tokens on initial authentication - no continuous polling
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      console.log('🚫 User not authenticated - clearing token state');
      setTokens(null);
      setUsageSummary(null);
      return;
    }
    
    // Initial fetch when user is authenticated
    console.log('👤 User authenticated - fetching initial plan status and usage');
    fetchUserStatus();
    fetchUsageSummary();
  }, [isAuthenticated, user?.id, fetchUserStatus, fetchUsageSummary]);

  const togglePremium = async () => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };
    
    console.log('🪙 Toggling premium status with optimistic update');
    
    // Store current state for potential rollback
    const previousTokens = tokens;
    
    // Optimistically update UI immediately - toggle between 0 and 1
    const optimisticNewStatus = tokens === 1 ? 0 : 1;
    setTokens(optimisticNewStatus);
    
    // Show optimistic toast immediately
    const isPremium = checkIsPremium(optimisticNewStatus);
    toast({
      title: isPremium ? "Upgraded to Premium" : "Downgraded to Basic",
      description: isPremium ? "You now have premium access." : "You're now on the basic plan.",
    });
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('toggle_user_premium', {
        user_id: user.id
      });
      
      if (error) throw error;
      
      // Update with actual server response
      setTokens(data ?? 0);
      
      // Refresh usage summary after plan change
      await fetchUsageSummary();
      
      const actualIsPremium = checkIsPremium(data);
      console.log(`✅ Successfully toggled to ${actualIsPremium ? 'premium' : 'basic'}. Server status: ${data}`);
      
      return { success: true, isPremium: actualIsPremium, balance: data };
    } catch (error) {
      console.error('Error toggling premium status:', error);
      
      // Rollback optimistic update on error
      setTokens(previousTokens);
      toast({
        variant: "destructive",
        title: "Error updating plan",
        description: "Could not update your subscription plan. Changes have been reverted."
      });
      return { success: false, error };
    } finally {
      setIsLoading(false);
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
    usageSummary,
    isLoadingUsage,
    fetchUserStatus,
    fetchUsageSummary,
    checkUsageLimit,
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
