
import { usePlanStatus } from '@/context/PlanStatusContext';

// Simplified hook that now purely consumes the centralized context
// All polling and connection management has been removed
export const useUserTokens = () => {
  const planStatusContext = usePlanStatus();
  
  // Return a clean interface for backward compatibility
  return {
    tokens: planStatusContext.tokens,
    isPremium: planStatusContext.isPremium,
    isBasic: planStatusContext.isBasic,
    isLoading: planStatusContext.isLoading,
    fetchTokens: planStatusContext.fetchTokens,
    togglePremium: planStatusContext.togglePremium,
  };
};
