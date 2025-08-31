
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, UserData } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/lib/logger';

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  // Password recovery commented out for OAuth-only flow
  // isPasswordRecovery: boolean;
  // setPasswordRecoveryMode: (mode: boolean) => void;
  // login: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
  // signup: (email: string, password: string, firstName: string, lastName: string) => Promise<{ success: boolean; error?: any }>;
  logout: () => Promise<{ success: boolean; error?: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);
  const [initializationError, setInitializationError] = useState<Error | null>(null);
  // Password recovery commented out for OAuth-only flow
  // const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [isOAuthCallbackHandled, setIsOAuthCallbackHandled] = useState(false);
  const { toast } = useToast();

  // Password recovery function commented out for OAuth-only flow
  // const setPasswordRecoveryMode = (mode: boolean) => {
  //   console.log('Setting password recovery mode:', mode);
  //   setIsPasswordRecovery(mode);
  // };

  // Helper function to extract user names from metadata
  const extractUserNames = (user: any) => {
    const metadata = user.user_metadata || {};
    let firstName = metadata.first_name || '';
    let lastName = metadata.last_name || '';
    
    if ((!firstName || !lastName) && metadata.full_name) {
      const nameParts = metadata.full_name.split(' ');
      firstName = firstName || nameParts[0] || '';
      lastName = lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');
    } else if ((!firstName || !lastName) && metadata.name) {
      const nameParts = metadata.name.split(' ');
      firstName = firstName || nameParts[0] || '';
      lastName = lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');
    }
    
    const provider = user.app_metadata?.provider;
    if ((!firstName || !lastName)) {
      if (provider === 'github') {
        firstName = metadata.preferred_username || metadata.username || metadata.nickname || firstName;
      } else if (provider === 'google') {
        firstName = metadata.given_name || firstName;
        lastName = metadata.family_name || lastName;
      } else if (provider === 'linkedin_oidc') {
        // LinkedIn OIDC specific handling
        firstName = metadata.given_name || metadata.first_name || firstName;
        lastName = metadata.family_name || metadata.last_name || lastName;
      }
    }
    
    return { firstName, lastName };
  };

  const checkSession = async () => {
    try {
      logger.debug('Starting initial session check');
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      logger.debug('Initial session check result', { hasSession: !!data.session });
      
      if (data.session) {
        logger.info('User authenticated via session', { userId: data.session.user.id });
        logger.debug('OAuth provider detected', { provider: data.session.user.app_metadata?.provider });
        logger.debug('User metadata', data.session.user.user_metadata);
        
        const { firstName, lastName } = extractUserNames(data.session.user);
        const provider = data.session.user.app_metadata?.provider;
        auth.setUser({
          id: data.session.user.id,
          email: data.session.user.email || '',
          firstName,
          lastName,
          provider
        });
      } else {
        logger.debug('No session found, user not authenticated');
        auth.setUser(null);
      }
    } catch (error) {
      logger.error('Error checking session', error);
      setInitializationError(error instanceof Error ? error : new Error('Unknown session check error'));
      auth.setUser(null);
      
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: "There was a problem checking your login status. You might need to clear your browser cache.",
      });
    } finally {
      logger.debug('Finished initial session check');
      setIsLoading(false);
      setInitialCheckComplete(true);
    }
  };

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    
    try {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        logger.debug('Auth state changed', { event, hasSession: !!session });
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session) {
            logger.info('User signed in or token refreshed', { userId: session.user.id });
            logger.debug('OAuth provider', { provider: session.user.app_metadata?.provider });
            logger.debug('User metadata', session.user.user_metadata);
            
            const { firstName, lastName } = extractUserNames(session.user);
            const provider = session.user.app_metadata?.provider;
            auth.setUser({
              id: session.user.id,
              email: session.user.email || '',
              firstName,
              lastName,
              provider
            });

            // For OAuth sign-ins, automatically redirect to behavioral page
            // (REMOVED: This is now handled in AuthCallback.tsx based on profile existence)
          }
        } else if (event === 'SIGNED_OUT') {
          logger.info('User signed out, clearing auth state');
          auth.setUser(null);
          // setPasswordRecoveryMode(false); // Commented out for OAuth-only flow
        }
      });
      
      subscription = data.subscription;
      
      checkSession();
    } catch (error) {
      logger.error('Error setting up auth listener', error);
      setInitializationError(error instanceof Error ? error : new Error('Unknown auth listener error'));
      setIsLoading(false);
      setInitialCheckComplete(true);
      auth.setUser(null);
    }
    
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Handle OAuth callback parameters - improved to prevent loops
  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Check if we're on the callback page or have OAuth parameters
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      const hasAccessToken = hashParams.get('access_token');
      const hasAuthCode = urlParams.get('code');
      const hasError = urlParams.get('error');
      
      if (hasError) {
        logger.warn('OAuth error detected', { hasError });
        toast({
          variant: "destructive",
          title: "Authentication failed",
          description: "There was an error during the sign-in process. Please try again.",
        });
        return;
      }
      
      if ((hasAccessToken || hasAuthCode) && !isOAuthCallbackHandled) {
        logger.debug('OAuth callback detected, checking session');
        setIsOAuthCallbackHandled(true);
        
        // Wait for Supabase to process the callback
        setTimeout(async () => {
          try {
            const { data, error } = await supabase.auth.getSession();
            if (data.session) {
              logger.info('Session established after OAuth callback');
              logger.debug('Provider after callback', { provider: data.session.user.app_metadata?.provider });
              // The auth state change handler will handle the redirect
            } else {
              logger.debug('No session after OAuth callback, retrying');
              // Retry once more with longer delay
              setTimeout(async () => {
                const { data: retryData } = await supabase.auth.getSession();
                if (retryData.session) {
                  logger.info('Session established after retry');
                } else {
                  logger.warn('Failed to establish session after OAuth');
                  toast({
                    variant: "destructive",
                    title: "Authentication incomplete",
                    description: "Your sign-in didn't complete properly. Please try again.",
                  });
                }
              }, 1500);
            }
          } catch (error) {
            logger.error('Error checking session after OAuth callback', error);
          }
        }, 1000);
      }
    };

    handleOAuthCallback();
  }, [isOAuthCallbackHandled, toast]);

  useEffect(() => {
    if (initialCheckComplete) {
      setIsLoading(auth.isLoading);
    }
  }, [auth.isLoading, initialCheckComplete]);

  const value = {
    user: auth.user,
    isLoading: isLoading,
    isAuthenticated: !!auth.user,
    // Password recovery and manual auth commented out for OAuth-only flow
    // isPasswordRecovery,
    // setPasswordRecoveryMode,
    // login: auth.login,
    // signup: auth.signup,
    logout: auth.logout
  };

  logger.debug('AuthContext value updated', { 
    isAuthenticated: value.isAuthenticated, 
    userExists: !!value.user,
    isLoading: value.isLoading
    // isPasswordRecovery: value.isPasswordRecovery // Commented out for OAuth-only flow
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
