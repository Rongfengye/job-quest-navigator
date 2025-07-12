
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, debugSupabaseAuth } from '@/integrations/supabase/client';
import { useAuth, UserData } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPasswordRecovery: boolean;
  setPasswordRecoveryMode: (mode: boolean) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
  signup: (email: string, password: string, firstName: string, lastName: string) => Promise<{ success: boolean; error?: any }>;
  logout: () => Promise<{ success: boolean; error?: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);
  const [initializationError, setInitializationError] = useState<Error | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [isOAuthCallbackHandled, setIsOAuthCallbackHandled] = useState(false);
  const { toast } = useToast();

  const setPasswordRecoveryMode = (mode: boolean) => {
    console.log('Setting password recovery mode:', mode);
    setIsPasswordRecovery(mode);
  };

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
      console.log('🔍 Starting initial session check...');
      const authDebugInfo = await debugSupabaseAuth();
      console.log('🔧 Auth debug info:', authDebugInfo);
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      console.log('📊 Initial session check result:', data.session ? 'Session found' : 'No session found');
      
      if (data.session) {
        console.log('✅ User is authenticated via session, userId:', data.session.user.id);
        console.log('🔍 Actual OAuth Provider:', data.session.user.app_metadata?.provider);
        console.log('🔍 User metadata:', data.session.user.user_metadata);
        
        const { firstName, lastName } = extractUserNames(data.session.user);
        
        auth.setUser({
          id: data.session.user.id,
          email: data.session.user.email || '',
          firstName,
          lastName
        });
      } else {
        console.log('❌ No session found, user is not authenticated');
        auth.setUser(null);
      }
    } catch (error) {
      console.error("❌ Error checking session:", error);
      setInitializationError(error instanceof Error ? error : new Error('Unknown session check error'));
      auth.setUser(null);
      
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: "There was a problem checking your login status. You might need to clear your browser cache.",
      });
    } finally {
      console.log('✅ Finished initial session check, setting isLoading to false');
      setIsLoading(false);
      setInitialCheckComplete(true);
    }
  };

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    
    try {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        console.log("🔄 Auth state changed:", event, session ? 'Session exists' : 'No session');
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session) {
            console.log('✅ User signed in or token refreshed, updating auth state, userId:', session.user.id);
            console.log('🔍 OAuth Provider:', session.user.app_metadata?.provider);
            console.log('🔍 User metadata:', session.user.user_metadata);
            
            const { firstName, lastName } = extractUserNames(session.user);
            
            auth.setUser({
              id: session.user.id,
              email: session.user.email || '',
              firstName,
              lastName
            });

            // For OAuth sign-ins, automatically redirect to behavioral page
            const provider = session.user.app_metadata?.provider;
            if (provider && ['google', 'github', 'linkedin_oidc'].includes(provider)) {
              console.log('🚀 OAuth sign-in detected, will redirect to /behavioral');
              // Add a small delay to ensure the auth state is fully updated
              setTimeout(() => {
                if (window.location.pathname !== '/behavioral') {
                  window.location.href = '/behavioral';
                }
              }, 200);
            }
          }
        } else if (event === 'PASSWORD_RECOVERY') {
          console.log('🔑 Password recovery event detected');
          if (session) {
            console.log('✅ User authenticated via password recovery, setting recovery mode');
            
            const { firstName, lastName } = extractUserNames(session.user);
            
            auth.setUser({
              id: session.user.id,
              email: session.user.email || '',
              firstName,
              lastName
            });
            
            setPasswordRecoveryMode(true);
            
            toast({
              title: "Password Recovery",
              description: "Please set your new password to continue.",
            });
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out, clearing auth state');
          auth.setUser(null);
          setPasswordRecoveryMode(false);
        }
      });
      
      subscription = data.subscription;
      
      checkSession();
    } catch (error) {
      console.error("❌ Error setting up auth listener:", error);
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
        console.log('❌ OAuth error detected:', hasError);
        toast({
          variant: "destructive",
          title: "Authentication failed",
          description: "There was an error during the sign-in process. Please try again.",
        });
        return;
      }
      
      if ((hasAccessToken || hasAuthCode) && !isOAuthCallbackHandled) {
        console.log('🔗 OAuth callback detected, checking session...');
        setIsOAuthCallbackHandled(true);
        
        // Wait for Supabase to process the callback
        setTimeout(async () => {
          try {
            const { data, error } = await supabase.auth.getSession();
            if (data.session) {
              console.log('✅ Session established after OAuth callback');
              console.log('🔍 Provider after callback:', data.session.user.app_metadata?.provider);
              // The auth state change handler will handle the redirect
            } else {
              console.log('⚠️ No session after OAuth callback, retrying...');
              // Retry once more with longer delay
              setTimeout(async () => {
                const { data: retryData } = await supabase.auth.getSession();
                if (retryData.session) {
                  console.log('✅ Session established after retry');
                } else {
                  console.log('❌ Failed to establish session after OAuth');
                  toast({
                    variant: "destructive",
                    title: "Authentication incomplete",
                    description: "Your sign-in didn't complete properly. Please try again.",
                  });
                }
              }, 1500);
            }
          } catch (error) {
            console.error('❌ Error checking session after OAuth callback:', error);
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
    isPasswordRecovery,
    setPasswordRecoveryMode,
    login: auth.login,
    signup: auth.signup,
    logout: auth.logout
  };

  console.log('🔧 AuthContext value updated:', { 
    isAuthenticated: value.isAuthenticated, 
    userExists: !!value.user,
    isLoading: value.isLoading,
    isPasswordRecovery: value.isPasswordRecovery
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
