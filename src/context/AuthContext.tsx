
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

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('Checking initial session...');
        const { data } = await supabase.auth.getSession();
        console.log('Initial session check:', data.session);
        
        if (data.session) {
          // We have a session, so the user is authenticated
          console.log('User is authenticated via session, user ID:', data.session.user.id);
          
          try {
            console.log('Fetching user profile from storyline_users...');
            // Fetch user profile from storyline_users which is automatically generated via trigger
            const { data: userData, error } = await supabase
              .from('storyline_users')
              .select('*')
              .eq('id', data.session.user.id)
              .single();
            
            console.log('User data query result:', userData, error);
            
            if (userData && !error) {
              console.log('Successfully fetched user profile, setting user state');
              // Set user in auth hook
              auth.setUser({
                id: userData.id,
                email: userData.email,
                firstName: userData.first_name,
                lastName: userData.last_name
              });
            } else {
              console.error('Failed to fetch user data but session exists:', error);
              // Even if we failed to fetch user data, we still have a valid session
              // Set minimal user data from session
              console.log('Setting minimal user data from session');
              auth.setUser({
                id: data.session.user.id,
                email: data.session.user.email || '',
                firstName: data.session.user.user_metadata?.first_name || '',
                lastName: data.session.user.user_metadata?.last_name || ''
              });
            }
          } catch (profileError) {
            console.error('Error fetching user profile:', profileError);
            // Set user from session data as fallback
            console.log('Setting user from session data as fallback');
            auth.setUser({
              id: data.session.user.id,
              email: data.session.user.email || '',
              firstName: data.session.user.user_metadata?.first_name || '',
              lastName: data.session.user.user_metadata?.last_name || ''
            });
          }
        } else {
          console.log('No session found, user is not authenticated');
          auth.setUser(null);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        auth.setUser(null);
      } finally {
        console.log('Initial session check completed, setting isLoading to false');
        setIsLoading(false);
      }
    };
    
    checkSession();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) {
          console.log('User signed in or token refreshed, updating auth state for user ID:', session.user.id);
          
          try {
            console.log('Fetching user profile data after auth change...');
            // Fetch user profile when auth state changes
            const { data: userData, error } = await supabase
              .from('storyline_users')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            console.log('User profile fetch result:', { userData, error });
            
            if (userData && !error) {
              console.log('Successfully fetched user profile after auth change');
              auth.setUser({
                id: userData.id,
                email: userData.email,
                firstName: userData.first_name,
                lastName: userData.last_name
              });
            } else {
              console.error('Failed to fetch user data after auth change:', error);
              console.log('Error details:', JSON.stringify(error));
              // Even if we failed to fetch user data, we still have a valid session
              // Set minimal user data from session
              console.log('Setting minimal user data from session after auth change');
              auth.setUser({
                id: session.user.id,
                email: session.user.email || '',
                firstName: session.user.user_metadata?.first_name || '',
                lastName: session.user.user_metadata?.last_name || ''
              });
            }
          } catch (profileError) {
            console.error('Error fetching user profile after auth change:', profileError);
            // Set user from session data as fallback
            console.log('Setting user from session data as fallback after auth change');
            auth.setUser({
              id: session.user.id,
              email: session.user.email || '',
              firstName: session.user.user_metadata?.first_name || '',
              lastName: session.user.user_metadata?.last_name || ''
            });
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, clearing auth state');
        auth.setUser(null);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Add additional logging to see when auth state changes in the context
  useEffect(() => {
    console.log('AuthContext state updated:', { 
      user: auth.user, 
      isAuthenticated: !!auth.user,
      isLoading
    });
  }, [auth.user, isLoading]);

  const value = {
    user: auth.user,
    isLoading: isLoading || auth.isLoading,
    isAuthenticated: !!auth.user,
    login: auth.login,
    signup: auth.signup,
    logout: auth.logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
