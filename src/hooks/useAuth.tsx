import { useState, useEffect } from 'react';
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
      user, 
      isAuthenticated: !!user,
      userDetails: user ? {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      } : 'No user'
    });
  }, [user]);

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

      console.log('Supabase auth.signUp response:', { authData, authError });

      if (authError) {
        console.error('Supabase auth error:', authError);
        throw authError;
      }
      
      if (!authData.user) {
        console.error('No user data returned from Supabase');
        throw new Error('Failed to create user');
      }

      console.log('Auth user created successfully:', authData.user);
      console.log('User session state:', authData.session);
      
      // Set user in state
      console.log('Setting user in local state...');
      const userData = {
        id: authData.user.id,
        email: authData.user.email || email,
        firstName,
        lastName
      };
      console.log('User data being set:', userData);
      setUser(userData);
      console.log('User state set successfully, checking if state updated:', user);

      console.log('Showing success toast...');
      toast({
        title: "Account created",
        description: "Your account has been created successfully.",
      });
      
      console.log('Signup process completed successfully');
      return { success: true, user: authData.user };
    } catch (error) {
      console.error('Signup error details:', error);
      toast({
        variant: "destructive",
        title: "Error creating account",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
      return { success: false, error };
    } finally {
      console.log('Setting isLoading to false');
      setIsLoading(false);
      console.log('Signup function completed');
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Fetch user profile data - the storyline_users row should exist due to the trigger
      const { data: userData, error: userError } = await supabase
        .from('storyline_users')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (userError) {
        // Even if we couldn't get profile data, we know the user is logged in
        console.log('User authenticated but profile not found, using session data');
        setUser({
          id: data.user.id,
          email: data.user.email || email,
          firstName: data.user.user_metadata?.first_name || '',
          lastName: data.user.user_metadata?.last_name || ''
        });
      } else {
        setUser({
          id: userData.id,
          email: userData.email,
          firstName: userData.first_name,
          lastName: userData.last_name
        });
      }

      toast({
        title: "Logged in",
        description: "You have been logged in successfully.",
      });
      
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
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
      
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
      setIsLoading(false);
    }
  };

  // Create a more reliable setUser function that ensures state updates
  const setUserState = (userData: UserData | null) => {
    console.log('setUserState called with:', userData);
    setUser(userData);
    // Log immediately after setting
    setTimeout(() => {
      console.log('User state after setUserState:', user);
    }, 0);
  };

  return {
    user,
    isLoading,
    signup,
    login,
    logout,
    setUser: setUserState
  };
};
