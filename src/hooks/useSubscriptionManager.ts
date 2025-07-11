
import { useEffect, useRef, useCallback } from 'react';
import { usePlanStatus } from '@/context/PlanStatusContext';
import { useToast } from '@/components/ui/use-toast';

interface UseSubscriptionManagerOptions {
  enablePeriodicCheck?: boolean;
  enableVisibilityCheck?: boolean;
  checkInterval?: number;
}

export const useSubscriptionManager = (options: UseSubscriptionManagerOptions = {}) => {
  const {
    enablePeriodicCheck = true,
    enableVisibilityCheck = true,
    checkInterval = 300000, // 5 minutes
  } = options;

  const { syncSubscriptionStatus, isLoading } = usePlanStatus();
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout>();
  const lastCheckRef = useRef<number>(0);

  const performSync = useCallback(async (showErrors = false) => {
    // Debounce: don't sync if we just did it within the last 30 seconds
    const now = Date.now();
    if (now - lastCheckRef.current < 30000) {
      return;
    }

    try {
      lastCheckRef.current = now;
      await syncSubscriptionStatus();
    } catch (error) {
      if (showErrors) {
        console.error('Subscription sync failed:', error);
        toast({
          variant: "destructive",
          title: "Sync Failed",
          description: "Could not verify subscription status. Please try refreshing the page."
        });
      }
    }
  }, [syncSubscriptionStatus, toast]);

  // Periodic subscription check
  useEffect(() => {
    if (!enablePeriodicCheck) return;

    intervalRef.current = setInterval(() => {
      if (!isLoading) {
        performSync(false);
      }
    }, checkInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enablePeriodicCheck, checkInterval, performSync, isLoading]);

  // Visibility change check
  useEffect(() => {
    if (!enableVisibilityCheck) return;

    const handleVisibilityChange = () => {
      if (!document.hidden && !isLoading) {
        // User returned to tab, sync subscription status
        performSync(false);
      }
    };

    const handleFocus = () => {
      if (!isLoading) {
        performSync(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [enableVisibilityCheck, performSync, isLoading]);

  const manualSync = useCallback(() => {
    performSync(true);
  }, [performSync]);

  return {
    manualSync,
    isLoading,
  };
};
