
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, debugSupabaseAuth } from '@/integrations/supabase/client';
import { useAuth, UserData } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
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
  const [hadPreviousSession, setHadPreviousSession] = useState(false);
  const { toast } = useToast();

  // Helper function to check if there was a previous session
  const checkForPreviousSession = () => {
    try {
      // Check for session-related items in storage
      const hasLocalStorageSession = !!localStorage.getItem('storyline-auth-token');
      const hasSessionStorageSession = !!sessionStorage.getItem('storyline-auth-token');
      const hasSbAuthToken = !!localStorage.getItem('supabase.auth.token');
      
      const hasPreviousSession = hasLocalStorageSession || hasSessionStorageSession || hasSbAuthToken;
      console.log('Previous session detection:', { 
        hasLocalStorageSession, 
        hasSessionStorageSession, 
        hasSbAuthToken,
        hasPreviousSession 
      });
      
      setHadPreviousSession(hasPreviousSession);
      return hasPreviousSession;
    } catch (error) {
      console.error('Error checking for previous session:', error);
      return false;
    }
  };

  // Helper function to ensure user has tokens record
  const ensureUserTokens = async (userId: string) => {
    try {
      console.log('Checking if user has tokens record...');
      
      // Check if user has a tokens record
      const { data: tokensRecord, error: tokensError } = await supabase
        .from('storyline_user_tokens')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (tokensError) {
        console.error('Error checking tokens record:', tokensError);
        return;
      }
      
      // If no tokens record exists, create one
      if (!tokensRecord) {
        console.log('No tokens record found, creating new one...');
        
        const { data: newRecord, error: insertError } = await supabase
          .from('storyline_user_tokens')
          .insert([{ user_id: userId, tokens_remaining: 100 }])
          .select()
          .single();
        
        if (insertError) {
          console.error('Error creating tokens record:', insertError);
        } else {
          console.log('Created new tokens record:', newRecord);
        }
      } else {
        console.log('Existing tokens record found:', tokensRecord);
      }
    } catch (error) {
      console.error('Error in ensureUserTokens:', error);
    }
  };

  // Initial auth check function
  const checkSession = async () => {
    try {
      console.log('Starting initial session check...');
      // Log auth debug info
      const authDebugInfo = await debugSupabaseAuth();
      console.log('Auth debug info:', authDebugInfo);
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      console.log('Initial session check result:', data.session ? 'Session found' : 'No session found');
      
      if (data.session) {
        // We have a session, so the user is authenticated
        console.log('User is authenticated via session, userId:', data.session.user.id);
        
        // Extract name data from user metadata
        const metadata = data.session.user.user_metadata || {};
        let firstName = metadata.first_name || '';
        let lastName = metadata.last_name || '';
        
        // Handle various metadata formats
        if ((!firstName || !lastName) && metadata.full_name) {
          const nameParts = metadata.full_name.split(' ');
          firstName = firstName || nameParts[0] || '';
          lastName = lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');
        } else if ((!firstName || !lastName) && metadata.name) {
          const nameParts = metadata.name.split(' ');
          firstName = firstName || nameParts[0] || '';
          lastName = lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');
        }
        
        // Handle provider-specific metadata formats
        const provider = data.session.user.app_metadata?.provider;
        if ((!firstName || !lastName)) {
          if (provider === 'github') {
            firstName = metadata.preferred_username || metadata.username || metadata.nickname || firstName;
          } else if (provider === 'google') {
            firstName = metadata.given_name || firstName;
            lastName = metadata.family_name || lastName;
          }
        }
        
        // Set user data
        auth.setUser({
          id: data.session.user.id,
          email: data.session.user.email || '',
          firstName,
          lastName
        });
        
        // Ensure user has a tokens record (outside the main flow)
        setTimeout(() => {
          ensureUserTokens(data.session.user.id);
        }, 0);
      } else {
        console.log('No session found, user is not authenticated');
        auth.setUser(null);
      }
    } catch (error) {
      console.error("Error checking session:", error);
      setInitializationError(error instanceof Error ? error : new Error('Unknown session check error'));
      auth.setUser(null);
      
      // Only show toast if there was a previous session
      if (hadPreviousSession) {
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: "There was a problem checking your login status. You might need to clear your browser cache.",
        });
      }
    } finally {
      console.log('Finished initial session check, setting isLoading to false');
      setIsLoading(false);
      setInitialCheckComplete(true);
    }
  };

  useEffect(() => {
    // Check for previous session immediately
    const hasPreviousSession = checkForPreviousSession();
    
    // Set maximum initialization time
    const maxInitTime = setTimeout(() => {
      if (isLoading) {
        console.error('Auth initialization timed out after 8 seconds');
        setIsLoading(false);
        setInitializationError(new Error('Authentication initialization timed out'));
        // Set user to null to ensure we have a non-loading state
        auth.setUser(null);
        
        // Only show toast if there was a previous session
        if (hasPreviousSession) {
          toast({
            variant: "destructive",
            title: "Authentication timeout",
            description: "Authentication initialization timed out. Using fallback.",
          });
        } else {
          console.log('Auth timeout occurred, but no previous session detected - suppressing toast');
        }
      }
    }, 8000);

    // First set up auth state listener
    let subscription: { unsubscribe: () => void } | null = null;
    
    try {
      // Set up auth state listener FIRST, before checking for session
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        console.log("Auth state changed:", event, session ? 'Session exists' : 'No session');
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session) {
            console.log('User signed in or token refreshed, updating auth state, userId:', session.user.id);
            
            // Extract name data from user metadata
            const metadata = session.user.user_metadata || {};
            let firstName = metadata.first_name || '';
            let lastName = metadata.last_name || '';
            
            // Handle various metadata formats
            if ((!firstName || !lastName) && metadata.full_name) {
              const nameParts = metadata.full_name.split(' ');
              firstName = firstName || nameParts[0] || '';
              lastName = lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');
            } else if ((!firstName || !lastName) && metadata.name) {
              const nameParts = metadata.name.split(' ');
              firstName = firstName || nameParts[0] || '';
              lastName = lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');
            }
            
            // Handle provider-specific metadata formats
            const provider = session.user.app_metadata?.provider;
            if ((!firstName || !lastName)) {
              if (provider === 'github') {
                firstName = metadata.preferred_username || metadata.username || metadata.nickname || firstName;
              } else if (provider === 'google') {
                firstName = metadata.given_name || firstName;
                lastName = metadata.family_name || lastName;
              }
            }
            
            // Set user data only once to prevent continuous updates
            auth.setUser({
              id: session.user.id,
              email: session.user.email || '',
              firstName,
              lastName
            });
            
            // Run this outside the auth state change callback to prevent deadlock
            setTimeout(() => {
              ensureUserTokens(session.user.id);
            }, 0);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing auth state');
          auth.setUser(null);
        }
      });
      
      subscription = data.subscription;
      
      // THEN check for existing session 
      checkSession();
    } catch (error) {
      console.error("Error setting up auth listener:", error);
      setInitializationError(error instanceof Error ? error : new Error('Unknown auth listener error'));
      setIsLoading(false);
      setInitialCheckComplete(true);
      auth.setUser(null);
    }
    
    return () => {
      clearTimeout(maxInitTime);
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Only update isLoading when auth.isLoading changes after initial check is complete
  useEffect(() => {
    if (initialCheckComplete) {
      setIsLoading(auth.isLoading);
    }
  }, [auth.isLoading, initialCheckComplete]);

  const value = {
    user: auth.user,
    isLoading: isLoading,
    isAuthenticated: !!auth.user,
    login: auth.login,
    signup: auth.signup,
    logout: auth.logout
  };

  console.log('AuthContext value updated:', { 
    isAuthenticated: value.isAuthenticated, 
    userExists: !!value.user,
    isLoading: value.isLoading,
    hadPreviousSession
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
