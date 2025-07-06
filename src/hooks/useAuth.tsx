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
    console.log('v23: useAuth hook state updated:', { 
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

  // Helper to extract name data from user metadata
  const extractUserNames = useCallback((userInfo: any) => {
    // First try to get from user_metadata
    const metadata = userInfo.user_metadata || {};
    let firstName = metadata.first_name || '';
    let lastName = metadata.last_name || '';
    
    // For GitHub and Google, we may need to extract from the full_name or name field
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
    if ((!firstName && !lastName)) {
      const provider = metadata.provider || userInfo.app_metadata?.provider;
      
      if (provider === 'github') {
        // For GitHub users, if no name is available, use the username/nickname as the first name
        firstName = metadata.preferred_username || metadata.username || metadata.nickname || firstName;
      } else if (provider === 'google') {
        // Google stores given_name and family_name 
        firstName = metadata.given_name || firstName;
        lastName = metadata.family_name || lastName;
      }
    }
    
    return { firstName, lastName };
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
      console.log('User metadata:', sessionData.session.user.user_metadata);
      console.log('App metadata:', sessionData.session.user.app_metadata);
      
      // Get name data using the helper
      const { firstName, lastName } = extractUserNames(sessionData.session.user);
      
      // Set user directly from session data
      setUserSafely({
        id: userId,
        email: sessionData.session.user.email || '',
        firstName,
        lastName
      });
      
      return { success: true, user: sessionData.session.user };
    } catch (error) {
      console.error('Unexpected error during manual sync:', error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, [setUserSafely, extractUserNames]);

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
      
      // Get name data using the helper
      const { firstName, lastName } = extractUserNames(data.user);
      
      // Set user directly from session data
      console.log('Setting user with session data');
      setUserSafely({
        id: data.user.id,
        email: data.user.email || email,
        firstName,
        lastName
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

  const resetPassword = async (email: string) => {
    console.log('Reset password function called with email:', email);
    setIsLoading(true);
    
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      console.log('Sending password reset email with redirect URL:', redirectUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      console.log('Supabase resetPasswordForEmail response:', { 
        success: !error, 
        error: error ? error.message : null
      });

      if (error) throw error;

      console.log('Showing success toast');
      toast({
        title: "Password reset email sent",
        description: "Check your email for instructions to reset your password.",
      });
      
      console.log('Reset password function completed successfully');
      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      toast({
        variant: "destructive",
        title: "Error sending password reset email",
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
    resetPassword,
    syncUserData,
    setUser: setUserSafely
  };
};
