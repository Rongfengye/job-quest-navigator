
import React, { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuthContext } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useUserTokens } from '@/hooks/useUserTokens';
import { Crown, User, Key } from 'lucide-react';
import UsageDisplay from '@/components/UsageDisplay';
import PasswordChangeModal from '@/components/settings/PasswordChangeModal';

const Settings = () => {
  const { logout } = useAuthContext();
  const navigate = useNavigate();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  const { isPremium, isBasic, isLoading: tokensLoading, togglePremium } = useUserTokens();
  const [isTogglingPlan, setIsTogglingPlan] = useState(false);
  
  const handleLogout = async () => {
    const { success } = await logout();
    if (success) {
      navigate('/');
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
          {/* Usage Display Card */}
          <UsageDisplay />

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
                Update your account security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Account Password</p>
                    <p className="text-sm text-muted-foreground">
                      Change your password to keep your account secure
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => setIsPasswordModalOpen(true)}
                  variant="outline"
                >
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>
          
        </div>
      </div>

      <PasswordChangeModal 
        open={isPasswordModalOpen}
        onOpenChange={setIsPasswordModalOpen}
      />
    </DashboardLayout>
  );
};

export default Settings;
