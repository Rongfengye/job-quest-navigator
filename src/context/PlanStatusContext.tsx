
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
  lastSyncTime: Date | null;
  syncError: string | null;
  fetchUserStatus: () => Promise<void>;
  fetchUsageSummary: () => Promise<void>;
  checkUsageLimit: (usageType: 'behavioral' | 'question_vault') => Promise<{ canProceed: boolean; message?: string }>;
  togglePremium: () => Promise<{ success: boolean; isPremium?: boolean; balance?: number; error?: any }>;
  syncSubscriptionStatus: () => Promise<void>;
  clearSyncError: () => void;
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
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuthContext();

  const clearSyncError = useCallback(() => {
    setSyncError(null);
  }, []);

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
      setSyncError(null);
    } catch (error) {
      console.error('Error fetching user plan status:', error);
      const errorMessage = "Could not retrieve your subscription status.";
      setSyncError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error fetching plan status",
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, toast]);

  const syncSubscriptionStatus = useCallback(async () => {
    if (!user?.id) return;
    
    console.log('🔄 Syncing subscription status with Stripe...');
    setIsLoading(true);
    setSyncError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('stripe-subscription-manager', {
        body: { action: 'SYNC_SUBSCRIPTION' }
      });
      
      if (error) throw error;
      
      console.log('✅ Stripe sync completed:', data);
      setLastSyncTime(new Date());
      
      // Refresh local status after sync
      await fetchUserStatus();
      await fetchUsageSummary();
      
    } catch (error) {
      console.error('Error syncing subscription status:', error);
      const errorMessage = "Could not verify your subscription status with Stripe.";
      setSyncError(errorMessage);
      
      // Only show toast for manual syncs, not automatic ones
      if (error instanceof Error && !error.message.includes('automatic')) {
        toast({
          variant: "destructive",
          title: "Error syncing subscription",
          description: errorMessage
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, toast, fetchUserStatus]);

  const fetchUsageSummary = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoadingUsage(true);
    try {
      const { data, error } = await supabase.rpc('get_user_monthly_usage_summary', {
        user_id: user.id
      });
      
      if (error) throw error;
      
      console.log('📈 Usage summary fetched:', data);
      setUsageSummary(data as unknown as UsageSummary);
      setSyncError(null);
    } catch (error) {
      console.error('Error fetching usage summary:', error);
      const errorMessage = "Could not retrieve your usage information.";
      setSyncError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error fetching usage data",
        description: errorMessage
      });
    } finally {
      setIsLoadingUsage(false);
    }
  }, [user?.id, toast]);

  const checkUsageLimit = useCallback(async (usageType: 'behavioral' | 'question_vault') => {
    if (!user?.id) {
      return { canProceed: false, message: 'Authentication required' };
    }
    
    console.log(`🔍 Checking usage limit for ${usageType} with Stripe verification...`);
    
    try {
      // First sync with Stripe to ensure we have the latest subscription status
      // Mark as automatic to avoid showing error toasts
      const syncError = new Error('automatic sync');
      try {
        await syncSubscriptionStatus();
      } catch (error) {
        // If sync fails, continue with current status but log the error
        console.warn('Stripe sync failed during usage check, using cached status:', error);
      }
      
      // Then check usage limits with the updated status
      const { data, error } = await supabase.rpc('check_user_monthly_usage', {
        user_id: user.id,
        usage_type: usageType
      });
      
      if (error) throw error;
      
      const result = data as unknown as UsageCheckResult;
      
      if (!result.canProceed) {
        const usageTypeLabel = usageType === 'behavioral' ? 'behavioral interview practices' : 'question vault generations';
        const message = result.isPremium 
          ? 'An error occurred while checking your usage limits.'
          : `You've reached your monthly limit of ${result.limit} ${usageTypeLabel}. Upgrade to Premium for unlimited access.`;
        
        return { canProceed: false, message };
      }
      
      console.log(`✅ Usage check passed for ${usageType}:`, result);
      return { canProceed: true };
    } catch (error) {
      console.error('Error checking usage limit:', error);
      return { canProceed: false, message: 'Failed to check usage limits. Please try again.' };
    }
  }, [user?.id, syncSubscriptionStatus]);

  // Enhanced initial authentication effect that includes Stripe sync
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      console.log('🚫 User not authenticated - clearing token state');
      setTokens(null);
      setUsageSummary(null);
      setLastSyncTime(null);
      setSyncError(null);
      return;
    }
    
    // Initial fetch when user is authenticated with Stripe sync
    console.log('👤 User authenticated - syncing with Stripe and fetching status');
    const initializeUserStatus = async () => {
      await syncSubscriptionStatus(); // This will also trigger fetchUserStatus and fetchUsageSummary
    };
    
    initializeUserStatus();
  }, [isAuthenticated, user?.id, syncSubscriptionStatus]);

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
    lastSyncTime,
    syncError,
    fetchUserStatus,
    fetchUsageSummary,
    checkUsageLimit,
    togglePremium,
    syncSubscriptionStatus,
    clearSyncError
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
