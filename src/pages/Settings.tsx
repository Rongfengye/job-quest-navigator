
import React, { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthContext } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserTokens } from '@/hooks/useUserTokens'; // <--- ensures it's imported

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

  // Token logic
  const { tokens, isLoading: tokensLoading, addTokens } = useUserTokens();
  const [isAddingTokens, setIsAddingTokens] = useState(false);

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

  const handleAddTokens = async () => {
    setIsAddingTokens(true);
    try {
      await addTokens(10);
    } finally {
      setIsAddingTokens(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-interview-primary">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings</p>
      </div>
      <div className="grid gap-6">
        {/* Token Management Card */}
        <Card>
          <CardHeader>
            <CardTitle>Tokens</CardTitle>
            <CardDescription>
              View and manage your interview tokens.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <span className="block text-sm text-muted-foreground mb-1">Token Balance</span>
                {tokensLoading ? (
                  <span className="font-medium text-gray-500">Loading...</span>
                ) : (
                  <span className="text-2xl font-bold text-interview-primary">{tokens ?? 0}</span>
                )}
              </div>
              <Button 
                onClick={handleAddTokens}
                disabled={tokensLoading || isAddingTokens}
                className="mt-2 md:mt-0 w-full md:w-auto"
                variant="outline"
              >
                {isAddingTokens ? 'Adding...' : 'Add 10 Tokens'}
              </Button>
            </div>
          </CardContent>
        </Card>
        {/* Password Settings Card */}
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
        {/* Danger Zone Card */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>
              Actions that may affect your account data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;

