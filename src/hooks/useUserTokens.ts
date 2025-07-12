
import { usePlanStatus } from '@/context/PlanStatusContext';

// Enhanced hook that provides both backward compatibility and new Stripe integration
export const useUserTokens = () => {
  const planStatusContext = usePlanStatus();
  
  // Return a clean interface for backward compatibility plus new Stripe features
  return {
    tokens: planStatusContext.tokens,
    isPremium: planStatusContext.isPremium,
    isBasic: planStatusContext.isBasic,
    isLoading: planStatusContext.isLoading,
    usageSummary: planStatusContext.usageSummary,
    isLoadingUsage: planStatusContext.isLoadingUsage,
    fetchUserStatus: planStatusContext.fetchUserStatus,
    fetchUsageSummary: planStatusContext.fetchUsageSummary,
    checkUsageLimit: planStatusContext.checkUsageLimit,
    togglePremium: planStatusContext.togglePremium,
    syncSubscriptionStatus: planStatusContext.syncSubscriptionStatus,
  };
};
