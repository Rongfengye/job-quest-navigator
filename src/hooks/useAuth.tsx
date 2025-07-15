
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  provider?: string;
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
      const provider = sessionData.session.user.app_metadata?.provider;
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
        lastName,
        provider
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
      
      // Set up email redirect URL for confirmation
      const redirectUrl = `${window.location.origin}/welcome`;
      
      // Create auth user with metadata and email confirmation
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName
          },
          emailRedirectTo: redirectUrl
        }
      });

      console.log('Supabase signup response:', { 
        success: !authError, 
        userId: authData?.user?.id,
        needsConfirmation: !authData?.user?.email_confirmed_at,
        error: authError ? authError.message : null
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Don't set user state immediately - wait for email confirmation
      console.log('Signup successful - user needs to confirm email');
      
      toast({
        title: "Account created",
        description: "Please check your email to confirm your account before logging in.",
      });
      
      console.log('Signup function completed successfully');
      return { success: true, user: authData.user, needsConfirmation: true };
    } catch (error) {
      console.error('Signup error:', error);
      
      // Handle specific error cases
      let errorMessage = "An unknown error occurred";
      if (error instanceof Error) {
        if (error.message.includes('already registered')) {
          errorMessage = "An account with this email already exists. Please try logging in instead.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        variant: "destructive",
        title: "Error creating account",
        description: errorMessage,
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

      if (error) {
        // Handle specific error cases
        if (error.message.includes('Email not confirmed')) {
          toast({
            variant: "destructive",
            title: "Email not confirmed",
            description: "Please check your email and click the confirmation link before logging in.",
          });
          return { success: false, error, needsConfirmation: true };
        }
        throw error;
      }
      
      // Get name data using the helper
      const { firstName, lastName } = extractUserNames(data.user);
      const provider = data.user.app_metadata?.provider;
      
      // Set user directly from session data
      console.log('Setting user with session data');
      setUserSafely({
        id: data.user.id,
        email: data.user.email || email,
        firstName,
        lastName,
        provider
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
      const redirectUrl = `${window.location.origin}/recover-password`;
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

  const updatePassword = async (newPassword: string) => {
    console.log('Update password function called');
    setIsLoading(true);
    
    try {
      console.log('Updating password with Supabase...');
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      console.log('Supabase updateUser response:', { 
        success: !error, 
        error: error ? error.message : null
      });

      if (error) throw error;

      console.log('Password updated successfully');
      toast({
        title: "Password updated successfully",
        description: "Your password has been changed successfully.",
      });
      
      console.log('Update password function completed successfully');
      return { success: true };
    } catch (error) {
      console.error('Update password error:', error);
      toast({
        variant: "destructive",
        title: "Error updating password",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
      return { success: false, error };
    } finally {
      console.log('Setting isLoading to false');
      setIsLoading(false);
    }
  };

  // Resend confirmation email for unconfirmed users
  const resendConfirmationEmail = async (email: string) => {
    setIsLoading(true);
    try {
      // Use a random password since we don't know the user's real password
      const randomPassword = Math.random().toString(36).slice(-8);
      const redirectUrl = `${window.location.origin}/welcome`;
      const { error } = await supabase.auth.signUp({
        email,
        password: randomPassword,
        options: { emailRedirectTo: redirectUrl }
      });
      if (!error) {
        toast({
          title: "Confirmation email sent",
          description: "If your email is registered and not yet confirmed, you'll receive a confirmation email shortly.",
        });
        return { success: true };
      } else if (error.message && error.message.includes('already registered')) {
        toast({
          variant: "destructive",
          title: "Account already confirmed",
          description: "Your account is already confirmed. Please log in.",
        });
        return { success: false, error };
      } else {
        toast({
          variant: "destructive",
          title: "Failed to resend confirmation email",
          description: error.message || "An unknown error occurred.",
        });
        return { success: false, error };
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to resend confirmation email",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
      return { success: false, error };
    } finally {
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
    updatePassword,
    syncUserData,
    setUser: setUserSafely,
    resendConfirmationEmail // Export the new function
  };
};
