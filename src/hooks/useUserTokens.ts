
import { usePlanStatus } from '@/context/PlanStatusContext';

// Simplified hook that purely consumes the centralized context
export const useUserTokens = () => {
  const planStatusContext = usePlanStatus();
  
  // Return a clean interface for backward compatibility
  return {
    tokens: planStatusContext.tokens,
    isPremium: planStatusContext.isPremium,
    isBasic: planStatusContext.isBasic,
    isLoading: planStatusContext.isLoading,
    fetchUserStatus: planStatusContext.fetchUserStatus,
    togglePremium: planStatusContext.togglePremium,
  };
};
