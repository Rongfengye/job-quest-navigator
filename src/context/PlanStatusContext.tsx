
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { filterValue } from '@/utils/supabaseTypes';

interface PlanStatusContextType {
  tokens: number | null;
  isPremium: boolean;
  isBasic: boolean;
  isLoading: boolean;
  isConnected: boolean;
  connectionHealth: 'healthy' | 'degraded' | 'disconnected';
  fetchTokens: () => Promise<void>;
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
  const [isConnected, setIsConnected] = useState(false);
  const [connectionHealth, setConnectionHealth] = useState<'healthy' | 'degraded' | 'disconnected'>('disconnected');
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuthContext();
  
  // Connection management refs
  const channelRef = useRef<any>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;
  const healthCheckInterval = useRef<number | undefined>(undefined);
  const connectionTimeout = useRef<number | undefined>(undefined);
  
  // Fallback polling refs
  const pollingInterval = useRef<number | undefined>(undefined);
  const lastActivity = useRef<number>(Date.now());
  const isUserActive = useRef<boolean>(true);
  const activityCheckInterval = useRef<number | undefined>(undefined);
  
  // Polling configuration
  const POLLING_INTERVAL_ACTIVE = 5 * 60 * 1000; // 5 minutes when active
  const POLLING_INTERVAL_INACTIVE = 10 * 60 * 1000; // 10 minutes when inactive
  const ACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes of inactivity
  
  // Update local state
  const updateTokenState = useCallback((newPlanStatus: number | null) => {
    console.log('✅ Plan status context updating to:', newPlanStatus);
    setTokens(newPlanStatus);
  }, []);

  const fetchTokens = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('hireme_user_status')
        .select('user_plan_status')
        .eq('user_id', filterValue(user.id))
        .maybeSingle();
      
      if (error) throw error;
      
      console.log('📊 Plan status fetched from database (context):', data?.user_plan_status);
      updateTokenState(data?.user_plan_status ?? null);
    } catch (error) {
      console.error('Error fetching user plan status:', error);
      setConnectionHealth('degraded');
      toast({
        variant: "destructive",
        title: "Error fetching plan status",
        description: "Could not retrieve your subscription status."
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, toast, updateTokenState]);

  // User activity detection
  const updateUserActivity = useCallback(() => {
    lastActivity.current = Date.now();
    if (!isUserActive.current) {
      isUserActive.current = true;
      console.log('👤 User became active - adjusting polling interval');
      startFallbackPolling(); // Restart with active interval
    }
  }, []);

  const startActivityMonitoring = useCallback(() => {
    // Track user activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, updateUserActivity, { passive: true });
    });
    
    // Check activity status periodically
    activityCheckInterval.current = window.setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivity.current;
      const wasActive = isUserActive.current;
      isUserActive.current = timeSinceLastActivity < ACTIVITY_TIMEOUT;
      
      if (wasActive && !isUserActive.current) {
        console.log('😴 User became inactive - adjusting polling interval');
        startFallbackPolling(); // Restart with inactive interval
      }
    }, 60000); // Check every minute
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateUserActivity);
      });
      if (activityCheckInterval.current) {
        clearInterval(activityCheckInterval.current);
        activityCheckInterval.current = undefined;
      }
    };
  }, [updateUserActivity]);

  // Fallback polling implementation
  const startFallbackPolling = useCallback(() => {
    if (!isAuthenticated || !user?.id) return;
    
    // Clear existing polling
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = undefined;
    }
    
    // Only start polling if WebSocket is not healthy
    if (connectionHealth === 'healthy') {
      console.log('🔗 WebSocket healthy - skipping fallback polling');
      return;
    }
    
    const interval = isUserActive.current ? POLLING_INTERVAL_ACTIVE : POLLING_INTERVAL_INACTIVE;
    console.log(`🔄 Starting fallback polling (${isUserActive.current ? 'active' : 'inactive'}: ${interval / 1000}s intervals)`);
    
    pollingInterval.current = window.setInterval(() => {
      console.log('📡 Fallback polling - fetching plan status');
      fetchTokens();
    }, interval);
  }, [isAuthenticated, user?.id, connectionHealth, fetchTokens]);

  const stopFallbackPolling = useCallback(() => {
    if (pollingInterval.current) {
      console.log('⏹️ Stopping fallback polling');
      clearInterval(pollingInterval.current);
      pollingInterval.current = undefined;
    }
  }, []);

  // Connection health monitoring
  const startHealthCheck = useCallback(() => {
    if (healthCheckInterval.current) return;
    
    healthCheckInterval.current = window.setInterval(() => {
      if (channelRef.current) {
        const channelState = channelRef.current.state;
        console.log('🔍 WebSocket health check - Channel state:', channelState);
        
        const previousHealth = connectionHealth;
        
        if (channelState === 'joined') {
          setConnectionHealth('healthy');
          setIsConnected(true);
          reconnectAttempts.current = 0;
          
          // Stop fallback polling when WebSocket is healthy
          if (previousHealth !== 'healthy') {
            stopFallbackPolling();
          }
        } else if (channelState === 'joining') {
          setConnectionHealth('degraded');
          setIsConnected(false);
          
          // Start fallback polling when connection is degraded
          if (previousHealth === 'healthy') {
            startFallbackPolling();
          }
        } else {
          setConnectionHealth('disconnected');
          setIsConnected(false);
          
          // Start fallback polling when disconnected
          if (previousHealth !== 'disconnected') {
            startFallbackPolling();
          }
          
          // Attempt reconnection if we haven't exceeded max attempts
          if (reconnectAttempts.current < maxReconnectAttempts) {
            console.log(`🔄 Attempting reconnection (${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
            reconnectAttempts.current++;
            setupWebSocketConnection();
          }
        }
      } else {
        const previousHealth = connectionHealth;
        setConnectionHealth('disconnected');
        setIsConnected(false);
        
        // Start fallback polling when no WebSocket connection
        if (previousHealth !== 'disconnected') {
          startFallbackPolling();
        }
      }
    }, 10000); // Check every 10 seconds
  }, [connectionHealth, startFallbackPolling, stopFallbackPolling]);

  const stopHealthCheck = useCallback(() => {
    if (healthCheckInterval.current) {
      clearInterval(healthCheckInterval.current);
      healthCheckInterval.current = undefined;
    }
  }, []);

  // Enhanced WebSocket connection setup with error handling
  const setupWebSocketConnection = useCallback(() => {
    if (!isAuthenticated || !user?.id) {
      console.log('🚫 Skipping WebSocket setup - user not authenticated');
      return;
    }

    // Clean up existing connection
    if (channelRef.current) {
      console.log('🧹 Cleaning up existing WebSocket connection');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log('🔄 Setting up smart WebSocket subscription for plan status');
    
    // Create new channel with enhanced error handling
    const channel = supabase
      .channel('plan-status-global', {
        config: {
          broadcast: { self: false },
          presence: { key: user.id }
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hireme_user_status',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 Realtime update received for plan status (context):', payload);
          // Set connection as healthy when receiving updates
          setConnectionHealth('healthy');
          setIsConnected(true);
          // Stop fallback polling when getting real-time updates
          stopFallbackPolling();
          // Refresh tokens whenever there's a change
          fetchTokens();
        }
      )
      .subscribe((status) => {
        console.log('📡 WebSocket subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          setConnectionHealth('healthy');
          setIsConnected(true);
          reconnectAttempts.current = 0;
          console.log('✅ WebSocket successfully connected');
          
          // Stop fallback polling when successfully connected
          stopFallbackPolling();
          
          // Start health monitoring
          startHealthCheck();
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionHealth('degraded');
          setIsConnected(false);
          console.error('❌ WebSocket connection error');
          startFallbackPolling();
        } else if (status === 'TIMED_OUT') {
          setConnectionHealth('disconnected');
          setIsConnected(false);
          console.error('⏰ WebSocket connection timed out');
          startFallbackPolling();
        }
      });
    
    channelRef.current = channel;
    
    // Set connection timeout
    connectionTimeout.current = window.setTimeout(() => {
      if (connectionHealth === 'disconnected') {
        console.log('⏰ Connection timeout - falling back to polling');
        setConnectionHealth('degraded');
        startFallbackPolling();
      }
    }, 15000); // 15 second timeout
    
  }, [isAuthenticated, user?.id, fetchTokens, startHealthCheck, startFallbackPolling, stopFallbackPolling, connectionHealth]);

  // Clean up connections
  const cleanupConnections = useCallback(() => {
    console.log('🧹 Cleaning up WebSocket connections and timers');
    
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    stopHealthCheck();
    stopFallbackPolling();
    
    if (connectionTimeout.current) {
      clearTimeout(connectionTimeout.current);
      connectionTimeout.current = undefined;
    }
    
    if (activityCheckInterval.current) {
      clearInterval(activityCheckInterval.current);
      activityCheckInterval.current = undefined;
    }
    
    setIsConnected(false);
    setConnectionHealth('disconnected');
    reconnectAttempts.current = 0;
  }, [stopHealthCheck, stopFallbackPolling]);

  // Main effect for conditional WebSocket activation
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      console.log('🚫 User not authenticated - cleaning up connections');
      cleanupConnections();
      return;
    }
    
    // Initial fetch
    fetchTokens();
    
    // Set up WebSocket connection with smart activation
    setupWebSocketConnection();
    
    // Start activity monitoring
    const cleanupActivity = startActivityMonitoring();
    
    return () => {
      cleanupConnections();
      cleanupActivity();
    };
  }, [isAuthenticated, user?.id, fetchTokens, setupWebSocketConnection, cleanupConnections, startActivityMonitoring]);

  const togglePremium = async () => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };
    
    console.log('🪙 Toggling premium status (context)');
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('toggle_user_premium', {
        user_id: user.id
      });
      
      if (error) throw error;
      
      updateTokenState(data ?? 0);
      const isPremium = checkIsPremium(data);
      console.log(`✅ Successfully toggled to ${isPremium ? 'premium' : 'basic'}. New status: ${data}`);
      
      toast({
        title: isPremium ? "Upgraded to Premium" : "Downgraded to Basic",
        description: isPremium ? "You now have premium access." : "You're now on the basic plan.",
      });
      
      return { success: true, isPremium, balance: data };
    } catch (error) {
      console.error('Error toggling premium status:', error);
      setConnectionHealth('degraded');
      toast({
        variant: "destructive",
        title: "Error updating plan",
        description: "Could not update your subscription plan."
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
    isConnected,
    connectionHealth,
    fetchTokens,
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
