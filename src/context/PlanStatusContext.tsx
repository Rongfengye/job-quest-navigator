
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { filterValue } from '@/utils/supabaseTypes';
import { shouldPerformFullSync, checkLocalSubscriptionStatus } from '@/utils/subscriptionUtils';
import { logger } from '@/lib/logger';

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
  planStatus: number | null;
  customPremium: number | null;
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

// Updated helper function to check if user is premium (either user_plan_status = 1 OR custom_premium = 1)
const checkIsPremium = (planStatus: number | null, customPremium: number | null): boolean => {
  return planStatus === 1 || customPremium === 1;
};

interface PlanStatusProviderProps {
  children: ReactNode;
}

export const PlanStatusProvider: React.FC<PlanStatusProviderProps> = ({ children }) => {
  const [planStatus, setPlanStatus] = useState<number | null>(null);
  const [customPremium, setCustomPremium] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);
  const [hasInitializedSession, setHasInitializedSession] = useState(false);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuthContext();

  // Enhanced fetchUserStatus with smart sync logic
  const fetchUserStatus = useCallback(async (reason: string = 'manual') => {
    if (!user?.id) return;
    
    logger.debug('fetchUserStatus called', { reason });
    setIsLoading(true);
    
    try {
      // Determine if we need full Stripe sync or can use local data
      const needsFullSync = await shouldPerformFullSync(user.id, reason);
      
      if (needsFullSync) {
        logger.info('Performing full Stripe sync', { reason });
        
        // Call the Stripe sync function
        const { data: syncData, error: syncError } = await supabase.functions.invoke('stripe-subscription-manager', {
          body: { action: 'SYNC_SUBSCRIPTION' },
        });

        if (syncError) {
          logger.error('Stripe sync error', syncError);
          // Fall back to local data on sync error
        } else {
          logger.info('Stripe sync completed successfully');
        }
      } else {
        logger.debug('Using local subscription data', { reason });
      }
      
      // Always fetch both plan status and custom_premium from hireme_user_status
      const { data, error } = await supabase
        .from('hireme_user_status')
        .select('user_plan_status, custom_premium')
        .eq('user_id', filterValue(user.id))
        .maybeSingle();
      
      if (error) throw error;
      
      logger.debug('Plan status fetched from database', data);
      setPlanStatus(data?.user_plan_status ?? null);
      setCustomPremium(data?.custom_premium ?? null);
      
    } catch (error) {
      logger.error('Error fetching user plan status', error);
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
      // Check if user is premium first to avoid unnecessary usage record creation
      const currentIsPremium = checkIsPremium(planStatus, customPremium);
      
      // If user is basic (not premium), ensure they have a usage record before fetching summary
      if (!currentIsPremium) {
        logger.info('Basic user detected - ensuring usage record exists');
        const { data: ensureData, error: ensureError } = await supabase.rpc('ensure_user_usage_record', {
          user_id: user.id
        });
        
        if (ensureError) {
          logger.warn('Could not ensure usage record', ensureError);
          // Continue with summary fetch anyway - the get_user_monthly_usage_summary function has its own fallbacks
        } else {
          logger.debug('Usage record ensured', ensureData);
        }
      }
      
      const { data, error } = await supabase.rpc('get_user_monthly_usage_summary', {
        user_id: user.id
      });
      
      if (error) throw error;
      
      logger.debug('Usage summary fetched', data);
      setUsageSummary(data as unknown as UsageSummary);
    } catch (error) {
      logger.error('Error fetching usage summary', error);
      toast({
        variant: "destructive",
        title: "Error fetching usage data",
        description: "Could not retrieve your usage information."
      });
    } finally {
      setIsLoadingUsage(false);
    }
  }, [user?.id, planStatus, customPremium, toast]);

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
      logger.error('Error checking usage limit', error);
      return { canProceed: false, message: 'Failed to check usage limits. Please try again.' };
    }
  }, [user?.id]);

  // Phase 2: Daily expiration check
  useEffect(() => {
    if (!user?.id) return;

    const checkDailyExpiration = async () => {
      const localStatus = await checkLocalSubscriptionStatus(user.id);
      if (localStatus?.isExpired && localStatus?.cancelAtPeriodEnd) {
        logger.info('Daily check: subscription expired and set to cancel');
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
      logger.debug('User not authenticated - clearing token state');
      setPlanStatus(null);
      setCustomPremium(null);
      setUsageSummary(null);
      setHasInitializedSession(false);
      return;
    }
    
    // App initialization sync - only once per session
    if (!hasInitializedSession) {
      logger.info('App initialization - performing critical sync');
      setHasInitializedSession(true);
      fetchUserStatus('app_initialization');
      fetchUsageSummary();
    }
  }, [isAuthenticated, user?.id, hasInitializedSession, fetchUserStatus, fetchUsageSummary]);

  const togglePremium = async () => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };
    
    logger.info('Toggling premium status with optimistic update');
    
    // Store current state for potential rollback
    const previousPlanStatus = planStatus;
    
    // Optimistically update UI immediately - toggle between 0 and 1
    const optimisticNewStatus = planStatus === 1 ? 0 : 1;
    setPlanStatus(optimisticNewStatus);
    
    // Show optimistic toast immediately
    const isPremium = checkIsPremium(optimisticNewStatus, customPremium);
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
      setPlanStatus(data ?? 0);
      
      // Refresh usage summary after plan change
      await fetchUsageSummary();
      
      const actualIsPremium = checkIsPremium(data, customPremium);
      logger.info('Successfully toggled premium status', { isPremium: actualIsPremium, serverStatus: data });
      
      return { success: true, isPremium: actualIsPremium, balance: data };
    } catch (error) {
      logger.error('Error toggling premium status', error);
      
      // Rollback optimistic update on error
      setPlanStatus(previousPlanStatus);
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
  const isPremium = checkIsPremium(planStatus, customPremium);
  const isBasic = !isPremium;

  const value: PlanStatusContextType = {
    planStatus,
    customPremium,
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
