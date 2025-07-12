
import { usePlanStatus } from '@/context/PlanStatusContext';

// Simplified hook that purely consumes the centralized context
export const useUserTokens = () => {
  const planStatusContext = usePlanStatus();
  
  // Return a clean interface for backward compatibility plus new usage features
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
  };
};
