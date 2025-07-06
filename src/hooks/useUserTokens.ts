
import { usePlanStatus } from '@/context/PlanStatusContext';

// Simplified hook that now purely consumes the centralized context
// All WebSocket management and connection handling is done in the context
export const useUserTokens = () => {
  const planStatusContext = usePlanStatus();
  
  // Return a clean interface for backward compatibility
  return {
    tokens: planStatusContext.tokens,
    isPremium: planStatusContext.isPremium,
    isBasic: planStatusContext.isBasic,
    isLoading: planStatusContext.isLoading,
    isConnected: planStatusContext.isConnected,
    connectionHealth: planStatusContext.connectionHealth,
    fetchTokens: planStatusContext.fetchTokens,
    togglePremium: planStatusContext.togglePremium,
    // Legacy subscribeToTokenUpdates removed - now handled entirely by context
    // Components no longer need to manually subscribe since context handles all updates
  };
};
