
import React, { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuthContext } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserTokens } from '@/hooks/useUserTokens';
import { Crown, User } from 'lucide-react';

const Settings = () => {
  const { logout } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  
  const { isPremium, isBasic, isLoading: tokensLoading, togglePremium } = useUserTokens();
  const [isTogglingPlan, setIsTogglingPlan] = useState(false);
  
  const handleLogout = async () => {
    const { success } = await logout();
    if (success) {
      navigate('/');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.new !== passwords.confirm) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "The new password and confirmation password must match."
      });
      return;
    }
    
    if (passwords.new.length < 6) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "The new password must be at least 6 characters long."
      });
      return;
    }
    
    try {
      setIsUpdatingPassword(true);
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email || '',
        password: passwords.current,
      });
      
      if (signInError) {
        throw new Error('Current password is incorrect');
      }
      
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwords.new
      });
      
      if (updateError) throw updateError;
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully."
      });
      
      setPasswords({ current: '', new: '', confirm: '' });
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error updating password",
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };
  
  const handleTogglePlan = async () => {
    setIsTogglingPlan(true);
    try {
      await togglePremium();
    } finally {
      setIsTogglingPlan(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-interview-primary">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account settings</p>
        </div>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plan</CardTitle>
              <CardDescription>
                Manage your account plan and access level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isPremium ? (
                    <>
                      <Crown className="h-6 w-6 text-yellow-500" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-semibold">Premium Plan</span>
                          <Badge variant="default" className="bg-yellow-500 text-white">
                            Premium
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Full access to all features
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <User className="h-6 w-6 text-gray-500" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-semibold">Free Plan</span>
                          <Badge variant="secondary">
                            Basic
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Limited access to features
                        </p>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="plan-toggle" className="text-sm font-medium">
                      {isBasic ? 'Upgrade to Premium' : 'Downgrade to Basic'}
                    </Label>
                    <Switch
                      id="plan-toggle"
                      checked={isPremium}
                      onCheckedChange={handleTogglePlan}
                      disabled={isTogglingPlan || tokensLoading}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Password Settings</CardTitle>
              <CardDescription>
                Update your account password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current">Current Password</Label>
                  <Input 
                    id="current"
                    name="current"
                    type="password"
                    value={passwords.current}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new">New Password</Label>
                  <Input 
                    id="new"
                    name="new"
                    type="password"
                    value={passwords.new}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm New Password</Label>
                  <Input 
                    id="confirm"
                    name="confirm"
                    type="password"
                    value={passwords.confirm}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="mt-4"
                  disabled={isUpdatingPassword}
                >
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
          
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
