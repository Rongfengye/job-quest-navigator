
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, UserData } from '@/hooks/useAuth';

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

  useEffect(() => {
    // First set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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
    
    // Then check for existing session
    const checkSession = async () => {
      try {
        console.log('Starting initial session check...');
        const { data } = await supabase.auth.getSession();
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
        auth.setUser(null);
      } finally {
        console.log('Finished initial session check, setting isLoading to false');
        setIsLoading(false);
        setInitialCheckComplete(true);
      }
    };
    
    checkSession();
    
    return () => {
      subscription.unsubscribe();
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
    isLoading: value.isLoading
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
