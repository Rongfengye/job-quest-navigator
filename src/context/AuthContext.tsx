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
  const { toast } = useToast();

  const setPasswordRecoveryMode = (mode: boolean) => {
    console.log('Setting password recovery mode:', mode);
    setIsPasswordRecovery(mode);
  };

  const checkSession = async () => {
    try {
      console.log('Starting initial session check...');
      const authDebugInfo = await debugSupabaseAuth();
      console.log('Auth debug info:', authDebugInfo);
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      console.log('Initial session check result:', data.session ? 'Session found' : 'No session found');
      
      if (data.session) {
        console.log('User is authenticated via session, userId:', data.session.user.id);
        
        const metadata = data.session.user.user_metadata || {};
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
        
        const provider = data.session.user.app_metadata?.provider;
        if ((!firstName || !lastName)) {
          if (provider === 'github') {
            firstName = metadata.preferred_username || metadata.username || metadata.nickname || firstName;
          } else if (provider === 'google') {
            firstName = metadata.given_name || firstName;
            lastName = metadata.family_name || lastName;
          }
        }
        
        auth.setUser({
          id: data.session.user.id,
          email: data.session.user.email || '',
          firstName,
          lastName
        });
      } else {
        console.log('No session found, user is not authenticated');
        auth.setUser(null);
      }
    } catch (error) {
      console.error("Error checking session:", error);
      setInitializationError(error instanceof Error ? error : new Error('Unknown session check error'));
      auth.setUser(null);
      
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: "There was a problem checking your login status. You might need to clear your browser cache.",
      });
    } finally {
      console.log('Finished initial session check, setting isLoading to false');
      setIsLoading(false);
      setInitialCheckComplete(true);
    }
  };

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    
    try {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        console.log("Auth state changed:", event, session ? 'Session exists' : 'No session');
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session) {
            console.log('User signed in or token refreshed, updating auth state, userId:', session.user.id);
            
            const metadata = session.user.user_metadata || {};
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
            
            const provider = session.user.app_metadata?.provider;
            if ((!firstName || !lastName)) {
              if (provider === 'github') {
                firstName = metadata.preferred_username || metadata.username || metadata.nickname || firstName;
              } else if (provider === 'google') {
                firstName = metadata.given_name || firstName;
                lastName = metadata.family_name || lastName;
              }
            }
            
            auth.setUser({
              id: session.user.id,
              email: session.user.email || '',
              firstName,
              lastName
            });
          }
        } else if (event === 'PASSWORD_RECOVERY') {
          console.log('Password recovery event detected');
          if (session) {
            console.log('User authenticated via password recovery, setting recovery mode');
            
            const metadata = session.user.user_metadata || {};
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
            
            const provider = session.user.app_metadata?.provider;
            if ((!firstName || !lastName)) {
              if (provider === 'github') {
                firstName = metadata.preferred_username || metadata.username || metadata.nickname || firstName;
              } else if (provider === 'google') {
                firstName = metadata.given_name || firstName;
                lastName = metadata.family_name || lastName;
              }
            }
            
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
          console.log('User signed out, clearing auth state');
          auth.setUser(null);
          setPasswordRecoveryMode(false);
        }
      });
      
      subscription = data.subscription;
      
      checkSession();
    } catch (error) {
      console.error("Error setting up auth listener:", error);
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

  console.log('AuthContext value updated:', { 
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
