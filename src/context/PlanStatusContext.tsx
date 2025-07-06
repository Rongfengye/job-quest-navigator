
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

  // Connection health monitoring
  const startHealthCheck = useCallback(() => {
    if (healthCheckInterval.current) return;
    
    healthCheckInterval.current = window.setInterval(() => {
      if (channelRef.current) {
        const channelState = channelRef.current.state;
        console.log('🔍 WebSocket health check - Channel state:', channelState);
        
        if (channelState === 'joined') {
          setConnectionHealth('healthy');
          setIsConnected(true);
          reconnectAttempts.current = 0;
        } else if (channelState === 'joining') {
          setConnectionHealth('degraded');
          setIsConnected(false);
        } else {
          setConnectionHealth('disconnected');
          setIsConnected(false);
          
          // Attempt reconnection if we haven't exceeded max attempts
          if (reconnectAttempts.current < maxReconnectAttempts) {
            console.log(`🔄 Attempting reconnection (${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
            reconnectAttempts.current++;
            setupWebSocketConnection();
          }
        }
      } else {
        setConnectionHealth('disconnected');
        setIsConnected(false);
      }
    }, 10000); // Check every 10 seconds
  }, []);

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
          
          // Start health monitoring
          startHealthCheck();
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionHealth('degraded');
          setIsConnected(false);
          console.error('❌ WebSocket connection error');
        } else if (status === 'TIMED_OUT') {
          setConnectionHealth('disconnected');
          setIsConnected(false);
          console.error('⏰ WebSocket connection timed out');
        }
      });
    
    channelRef.current = channel;
    
    // Set connection timeout
    connectionTimeout.current = window.setTimeout(() => {
      if (connectionHealth === 'disconnected') {
        console.log('⏰ Connection timeout - falling back to polling');
        setConnectionHealth('degraded');
      }
    }, 15000); // 15 second timeout
    
  }, [isAuthenticated, user?.id, fetchTokens, startHealthCheck]);

  // Clean up connections
  const cleanupConnections = useCallback(() => {
    console.log('🧹 Cleaning up WebSocket connections and timers');
    
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    stopHealthCheck();
    
    if (connectionTimeout.current) {
      clearTimeout(connectionTimeout.current);
      connectionTimeout.current = undefined;
    }
    
    setIsConnected(false);
    setConnectionHealth('disconnected');
    reconnectAttempts.current = 0;
  }, [stopHealthCheck]);

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
    
    return cleanupConnections;
  }, [isAuthenticated, user?.id, fetchTokens, setupWebSocketConnection, cleanupConnections]);

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
