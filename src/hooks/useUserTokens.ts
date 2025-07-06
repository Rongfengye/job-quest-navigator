import { usePlanStatus } from '@/context/PlanStatusContext';

// Legacy hook that now consumes the centralized context
// This maintains backward compatibility while using the new centralized system
export const useUserTokens = () => {
  const planStatusContext = usePlanStatus();
  
  // Return the same interface as before for backward compatibility
  return {
    tokens: planStatusContext.tokens,
    isPremium: planStatusContext.isPremium,
    isBasic: planStatusContext.isBasic,
    isLoading: planStatusContext.isLoading,
    fetchTokens: planStatusContext.fetchTokens,
    togglePremium: planStatusContext.togglePremium,
    addTokens: planStatusContext.addTokens,
    deductTokens: planStatusContext.deductTokens,
    // Keep the legacy subscribeToTokenUpdates function as a no-op for now
    // We'll remove this in Phase 3 when we clean up redundant mechanisms
    subscribeToTokenUpdates: () => {
      console.log('📢 subscribeToTokenUpdates called - now handled by context');
      return () => {}; // Return empty unsubscribe function
    }
  };
};
