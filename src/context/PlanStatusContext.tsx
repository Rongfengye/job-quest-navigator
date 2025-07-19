
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { filterValue } from '@/utils/supabaseTypes';
import { shouldPerformFullSync, checkLocalSubscriptionStatus } from '@/utils/subscriptionUtils';

interface UsageData {
  current: number;
  limit: number;
  remaining: number;
}

interface UsageSummary {
  isPremium: boolean;
  behavioral: UsageData;
  questionVault: UsageData;
  billingCycleStart?: string;
  nextResetDate?: string;
  hasActiveTracking?: boolean;
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
  fetchUserStatus: (reason?: string) => Promise<void>;
  fetchUsageSummary: () => Promise<void>;
  checkUsageLimit: (usageType: 'behavioral' | 'question_vault') => Promise<{ canProceed: boolean; message?: string; usageInfo?: any }>;
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
  const [hasInitializedSession, setHasInitializedSession] = useState(false);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuthContext();

  // Enhanced fetchUserStatus with smart sync logic
  const fetchUserStatus = useCallback(async (reason: string = 'manual') => {
    if (!user?.id) return;
    
    console.log(`📊 fetchUserStatus called with reason: ${reason}`);
    setIsLoading(true);
    
    try {
      // Determine if we need full Stripe sync or can use local data
      const needsFullSync = await shouldPerformFullSync(user.id, reason);
      
      if (needsFullSync) {
        console.log(`🔄 Performing full Stripe sync for reason: ${reason}`);
        
        // Call the Stripe sync function
        const { data: syncData, error: syncError } = await supabase.functions.invoke('stripe-subscription-manager', {
          body: { action: 'SYNC_SUBSCRIPTION' },
        });

        if (syncError) {
          console.error('Stripe sync error:', syncError);
          // Fall back to local data on sync error
        } else {
          console.log('✅ Stripe sync completed successfully');
        }
      } else {
        console.log(`⚡ Using local subscription data for reason: ${reason}`);
      }
      
      // Always fetch the current plan status from hireme_user_status
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
      setUsageSummary(data as unknown as UsageSummary);
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
      // Phase 2: Check local subscription data first for faster premium checks
      const localStatus = await checkLocalSubscriptionStatus(user.id);
      if (localStatus && !localStatus.isExpired && !localStatus.needsSync) {
        // User has active subscription locally, skip DB call
        const usageTypeLabel = usageType === 'behavioral' ? 'behavioral interview practices' : 'question vault generations';
        return { 
          canProceed: true,
          message: 'Unlimited access available',
          usageInfo: { isPremium: true, currentCount: 0, limit: -1, remaining: -1, canProceed: true }
        };
      }

      // Fall back to full usage check if local data suggests basic user or needs sync
      const { data, error } = await supabase.rpc('check_user_monthly_usage', {
        user_id: user.id,
        usage_type: usageType
      });
      
      if (error) throw error;
      
      const result = data as unknown as UsageCheckResult;
      
      // Always return canProceed: true for soft gates, but include usage info
      const usageTypeLabel = usageType === 'behavioral' ? 'behavioral interview practices' : 'question vault generations';
      const message = result.isPremium 
        ? 'Unlimited access available'
        : !result.canProceed 
          ? `You're about to use all ${result.limit} monthly ${usageTypeLabel}. Keep the momentum going?`
          : `${result.remaining} ${usageTypeLabel} remaining this month`;
      
      return { 
        canProceed: true, // Always allow proceeding for soft gates
        message,
        usageInfo: result // Include full usage info for soft gate display
      };
    } catch (error) {
      console.error('Error checking usage limit:', error);
      return { canProceed: false, message: 'Failed to check usage limits. Please try again.' };
    }
  }, [user?.id]);

  // Phase 2: Daily expiration check
  useEffect(() => {
    if (!user?.id) return;

    const checkDailyExpiration = async () => {
      const localStatus = await checkLocalSubscriptionStatus(user.id);
      if (localStatus?.isExpired && localStatus?.cancelAtPeriodEnd) {
        console.log('📅 Daily check: subscription expired and set to cancel');
        fetchUserStatus('daily_expiration_check');
      }
    };

    // Check immediately and then every hour
    checkDailyExpiration();
    const intervalId = setInterval(checkDailyExpiration, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(intervalId);
  }, [user?.id, fetchUserStatus]);

  // Initial authentication handling with session tracking
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      console.log('🚫 User not authenticated - clearing token state');
      setTokens(null);
      setUsageSummary(null);
      setHasInitializedSession(false);
      return;
    }
    
    // App initialization sync - only once per session
    if (!hasInitializedSession) {
      console.log('🚀 App initialization - performing critical sync');
      setHasInitializedSession(true);
      fetchUserStatus('app_initialization');
      fetchUsageSummary();
    }
  }, [isAuthenticated, user?.id, hasInitializedSession, fetchUserStatus, fetchUsageSummary]);

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
