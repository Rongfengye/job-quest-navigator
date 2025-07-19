import { usePlanStatus as usePlanStatusContext } from '@/context/PlanStatusContext';

// Clean hook that consumes the centralized plan status context
export const usePlanStatus = () => {
  const planStatusContext = usePlanStatusContext();
  
  // Return a clean interface with updated terminology
  return {
    planStatus: planStatusContext.planStatus,
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