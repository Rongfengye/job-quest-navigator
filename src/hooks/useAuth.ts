
import { useState } from 'react';
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

  const signup = async (email: string, password: string, firstName: string, lastName: string) => {
    setIsLoading(true);
    
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // 2. Add user to storyline_users table
      const { error: profileError } = await supabase
        .from('storyline_users')
        .insert([
          { 
            id: authData.user.id,
            email,
            first_name: firstName,
            last_name: lastName
          }
        ]);

      if (profileError) throw profileError;

      // Set user in state
      setUser({
        id: authData.user.id,
        email: authData.user.email || email,
        firstName,
        lastName
      });

      toast({
        title: "Account created",
        description: "Your account has been created successfully.",
      });
      
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
      setIsLoading(false);
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
      
      // Fetch user profile data
      const { data: userData, error: userError } = await supabase
        .from('storyline_users')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (userError) throw userError;
      
      setUser({
        id: userData.id,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name
      });

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

  return {
    user,
    isLoading,
    signup,
    login,
    logout
  };
};
