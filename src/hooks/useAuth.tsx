
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
    console.log('useAuth hook state updated:', { 
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

  // Function to manually sync user data from Supabase
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
      
      // Try to get user data from storyline_users
      const { data: userData, error } = await supabase
        .from('storyline_users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user data during manual sync:', error);
        
        // Fall back to session data
        setUserSafely({
          id: userId,
          email: sessionData.session.user.email || '',
          firstName: sessionData.session.user.user_metadata?.first_name || '',
          lastName: sessionData.session.user.user_metadata?.last_name || ''
        });
        
        return { success: true, error };
      }
      
      if (userData) {
        console.log('Successfully fetched user data during manual sync');
        setUserSafely({
          id: userData.id,
          email: userData.email,
          firstName: userData.first_name,
          lastName: userData.last_name
        });
        
        return { success: true, user: userData };
      } else {
        console.log('No user data found during manual sync, falling back to session data');
        
        // Fall back to session data
        setUserSafely({
          id: userId,
          email: sessionData.session.user.email || '',
          firstName: sessionData.session.user.user_metadata?.first_name || '',
          lastName: sessionData.session.user.user_metadata?.last_name || ''
        });
        
        return { success: true, user: null };
      }
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
      
      console.log('Fetching user profile data...');
      // Fetch user profile data - the storyline_users row should exist due to the trigger
      const { data: userData, error: userError } = await supabase
        .from('storyline_users')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();
      
      console.log('User profile fetch result:', { 
        success: !userError, 
        userData: userData || null,
        error: userError ? userError.message : null
      });

      if (userError || !userData) {
        // Even if we couldn't get profile data, we know the user is logged in
        console.log('User authenticated but profile not found, using session data');
        setUserSafely({
          id: data.user.id,
          email: data.user.email || email,
          firstName: data.user.user_metadata?.first_name || '',
          lastName: data.user.user_metadata?.last_name || ''
        });
        
        // Try to create the user profile if it doesn't exist
        if (!userData) {
          console.log('Attempting to create missing user profile');
          const { error: insertError } = await supabase
            .from('storyline_users')
            .insert({
              id: data.user.id,
              email: data.user.email || email,
              first_name: data.user.user_metadata?.first_name || '',
              last_name: data.user.user_metadata?.last_name || ''
            });
          
          if (insertError) {
            console.error('Error creating missing user profile:', insertError);
          } else {
            console.log('Successfully created missing user profile');
          }
        }
      } else {
        console.log('Setting user with profile data');
        setUserSafely({
          id: userData.id,
          email: userData.email,
          firstName: userData.first_name,
          lastName: userData.last_name
        });
      }

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
