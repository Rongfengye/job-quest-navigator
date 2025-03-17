
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const { toast } = useToast();

  // Log current auth state whenever it changes
  useEffect(() => {
    console.log('v22: useAuth hook state updated:', { 
      user: user ? {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      } : null, 
      isAuthenticated: !!user 
    });
  }, [user]);

  const setUserSafely = useCallback((userData: UserData | null) => {
    console.log('setUserSafely called with:', userData);
    setUser(userData);
  }, []);

  // Function to manually sync user data from Supabase auth
  const syncUserData = useCallback(async () => {
    console.log('Manually syncing user data from Supabase');
    setIsLoading(true);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        console.log('No active session found during manual sync');
        setUserSafely(null);
        return { success: false, error: 'No active session' };
      }
      
      const userId = sessionData.session.user.id;
      console.log('Found active session for user ID:', userId);
      
      // Get user directly from session data
      setUserSafely({
        id: userId,
        email: sessionData.session.user.email || '',
        firstName: sessionData.session.user.user_metadata?.first_name || '',
        lastName: sessionData.session.user.user_metadata?.last_name || ''
      });
      
      return { success: true, user: sessionData.session.user };
    } catch (error) {
      console.error('Unexpected error during manual sync:', error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, [setUserSafely]);

  const signup = async (email: string, password: string, firstName: string, lastName: string) => {
    console.log('Signup function called with:', { email, firstName, lastName });
    setIsLoading(true);
    
    try {
      console.log('Creating auth user with Supabase...');
      // Create auth user with metadata for the trigger
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName
          }
        }
      });

      console.log('Supabase signup response:', { 
        success: !authError, 
        userId: authData?.user?.id,
        error: authError ? authError.message : null
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      console.log('Setting user state after signup');
      // Set user in state
      setUserSafely({
        id: authData.user.id,
        email: authData.user.email || email,
        firstName,
        lastName
      });

      console.log('Showing success toast');
      toast({
        title: "Account created",
        description: "Your account has been created successfully.",
      });
      
      console.log('Signup function completed successfully');
      return { success: true, user: authData.user };
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        variant: "destructive",
        title: "Error creating account",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
      return { success: false, error };
    } finally {
      console.log('Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    console.log('Login function called with email:', email);
    setIsLoading(true);
    
    try {
      console.log('Attempting to sign in with Supabase...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Supabase login response:', { 
        success: !error, 
        userId: data?.user?.id,
        error: error ? error.message : null
      });

      if (error) throw error;
      
      // Set user directly from session data
      console.log('Setting user with session data');
      setUserSafely({
        id: data.user.id,
        email: data.user.email || email,
        firstName: data.user.user_metadata?.first_name || '',
        lastName: data.user.user_metadata?.last_name || ''
      });

      console.log('Showing success toast');
      toast({
        title: "Logged in",
        description: "You have been logged in successfully.",
      });
      
      console.log('Login function completed successfully');
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Error logging in",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
      return { success: false, error };
    } finally {
      console.log('Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const logout = async () => {
    console.log('Logout function called');
    setIsLoading(true);
    
    try {
      console.log('Calling Supabase signOut...');
      const { error } = await supabase.auth.signOut();
      
      console.log('Supabase signOut response:', { 
        success: !error, 
        error: error ? error.message : null
      });
      
      if (error) throw error;
      
      console.log('Clearing user state');
      setUserSafely(null);
      
      console.log('Showing success toast');
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
      
      console.log('Logout function completed successfully');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: "destructive",
        title: "Error logging out",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
      return { success: false, error };
    } finally {
      console.log('Setting isLoading to false');
      setIsLoading(false);
    }
  };

  return {
    user,
    isLoading,
    signup,
    login,
    logout,
    syncUserData,
    setUser: setUserSafely
  };
};
