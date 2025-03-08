
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
        console.log('Starting initial session check...');
        const { data } = await supabase.auth.getSession();
        console.log('Initial session check result:', data.session ? 'Session found' : 'No session found');
        
        if (data.session) {
          // We have a session, so the user is authenticated
          console.log('User is authenticated via session, userId:', data.session.user.id);
          
          // Fetch user profile from storyline_users which is automatically generated via trigger
          console.log('Fetching user profile from storyline_users...');
          
          // Use timeout to prevent hanging queries
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout after 5 seconds')), 5000)
          );
          
          try {
            // Race the query against the timeout
            const result = await Promise.race([
              supabase
                .from('storyline_users')
                .select('*')
                .eq('id', data.session.user.id)
                .maybeSingle(),
              timeoutPromise
            ]);
            
            // The result is now either the query result or it threw a timeout error
            console.log('User data fetch completed with result:', result);
            
            const { data: userData, error } = result as any;
            
            if (userData && !error) {
              console.log('User data fetched successfully:', userData);
              // Set user in auth hook
              auth.setUser({
                id: userData.id,
                email: userData.email,
                firstName: userData.first_name,
                lastName: userData.last_name
              });
            } else {
              console.warn('Failed to fetch user data but session exists:', error);
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
          } catch (queryError) {
            console.error('Error fetching user data:', queryError);
            // Handle timeout or other errors by falling back to session data
            console.log('Setting minimal user data from session after query error');
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
        console.log('Finished initial session check, setting isLoading to false');
        setIsLoading(false);
      }
    };
    
    checkSession();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session ? 'Session exists' : 'No session');
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) {
          console.log('User signed in or token refreshed, updating auth state, userId:', session.user.id);
          
          // Fetch user profile when auth state changes
          console.log('Fetching user profile after auth state change...');
          
          // Use timeout to prevent hanging queries
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout after 5 seconds')), 5000)
          );
          
          try {
            // Race the query against the timeout
            const result = await Promise.race([
              supabase
                .from('storyline_users')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle(),
              timeoutPromise
            ]);
            
            // The result is now either the query result or it threw a timeout error
            console.log('User data fetch after auth change completed with result:', result);
            
            const { data: userData, error } = result as any;
            
            console.log('User data fetch result:', userData ? 'Data found' : 'No data', error ? `Error: ${error.message}` : 'No error');
            
            if (userData && !error) {
              console.log('Setting user data from database');
              auth.setUser({
                id: userData.id,
                email: userData.email,
                firstName: userData.first_name,
                lastName: userData.last_name
              });
            } else {
              console.log('Setting minimal user data from session');
              // Even if we failed to fetch user data, we still have a valid session
              // Set minimal user data from session
              auth.setUser({
                id: session.user.id,
                email: session.user.email || '',
                firstName: session.user.user_metadata?.first_name || '',
                lastName: session.user.user_metadata?.last_name || ''
              });
            }
          } catch (queryError) {
            console.error('Error fetching user data after auth change:', queryError);
            // Handle timeout or other errors by falling back to session data
            console.log('Setting minimal user data from session after query error');
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

  const value = {
    user: auth.user,
    isLoading: isLoading || auth.isLoading,
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
