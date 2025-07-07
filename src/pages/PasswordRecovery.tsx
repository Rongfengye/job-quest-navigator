
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';

const PasswordRecovery = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated, setPasswordRecoveryMode } = useAuthContext();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    new: '',
    confirm: ''
  });

  useEffect(() => {
    console.log('🔍 PasswordRecovery page loaded:', { 
      isAuthenticated,
      url: window.location.href,
      searchParams: window.location.search,
      hash: window.location.hash
    });

    // Check if user is authenticated via recovery token
    const urlParams = new URLSearchParams(window.location.search);
    const hasRecoveryCode = urlParams.has('code') || window.location.hash.includes('access_token');
    
    if (hasRecoveryCode) {
      console.log('🔑 Recovery code detected, setting password recovery mode');
      setPasswordRecoveryMode(true);
    } else if (!isAuthenticated) {
      console.log('❌ No recovery code and not authenticated, redirecting to home');
      navigate('/');
    }
  }, [isAuthenticated, setPasswordRecoveryMode, navigate]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  const validatePassword = (password: string) => {
    const errors = [];
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    return errors;
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔄 Password reset form submitted');
    
    // Validate password strength
    const passwordErrors = validatePassword(passwords.new);
    if (passwordErrors.length > 0) {
      toast({
        variant: "destructive",
        title: "Password requirements not met",
        description: passwordErrors.join('. ')
      });
      return;
    }
    
    // Check if passwords match
    if (passwords.new !== passwords.confirm) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "The new password and confirmation password must match."
      });
      return;
    }
    
    try {
      setIsUpdating(true);
      console.log('🔄 Updating password with Supabase...');
      
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      });
      
      if (error) {
        console.error('❌ Password update error:', error);
        throw error;
      }
      
      console.log('✅ Password updated successfully');
      
      toast({
        title: "Password updated successfully",
        description: "Your password has been changed. Redirecting to your dashboard..."
      });
      
      // Clear form and URL parameters
      setPasswords({ new: '', confirm: '' });
      setPasswordRecoveryMode(false);
      
      // Clear URL parameters
      const url = new URL(window.location.href);
      url.search = '';
      url.hash = '';
      window.history.replaceState({}, document.title, url.pathname);
      
      // Redirect to behavioral dashboard
      setTimeout(() => {
        navigate('/behavioral');
      }, 1500);
      
    } catch (error) {
      console.error('❌ Password update failed:', error);
      toast({
        variant: "destructive",
        title: "Failed to update password",
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    console.log('❌ Password reset cancelled by user');
    setPasswordRecoveryMode(false);
    
    // Clear URL parameters
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    window.history.replaceState({}, document.title, url.pathname);
    
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-sky-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-interview-text-primary">
            Reset Your Password
          </CardTitle>
          <CardDescription>
            Please enter your new password below. Make sure it's secure and easy for you to remember.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new">New Password</Label>
              <div className="relative">
                <Input 
                  id="new"
                  name="new"
                  type={showPassword ? "text" : "password"}
                  value={passwords.new}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                  required
                  disabled={isUpdating}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isUpdating}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm New Password</Label>
              <div className="relative">
                <Input 
                  id="confirm"
                  name="confirm"
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwords.confirm}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                  required
                  disabled={isUpdating}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isUpdating}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              <p className="font-medium mb-1">Password requirements:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>At least 8 characters long</li>
                <li>Contains uppercase and lowercase letters</li>
                <li>Contains at least one number</li>
              </ul>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                disabled={isUpdating}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isUpdating || !passwords.new || !passwords.confirm}
                className="flex-1"
              >
                {isUpdating ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordRecovery;
