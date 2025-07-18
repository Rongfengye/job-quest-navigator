
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuthContext } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useUserTokens } from '@/hooks/useUserTokens';
import { Key, Loader2 } from 'lucide-react';
import PasswordChangeModal from '@/components/settings/PasswordChangeModal';
import UnifiedSettingsCard from '@/components/settings/UnifiedSettingsCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

const Settings = () => {
  const { logout, user } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  const { isPremium, isBasic, isLoading: tokensLoading, fetchUserStatus, usageSummary, isLoadingUsage } = useUserTokens();
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<{
    subscription_tier?: string;
    subscription_end?: string;
  } | null>(null);
  const [isVerifyingSubscription, setIsVerifyingSubscription] = useState(false);
  
  const handleLogout = async () => {
    const { success } = await logout();
    if (success) {
      navigate('/');
    }
  };

  useEffect(() => {
    const verifySubscription = async () => {
      setIsVerifyingSubscription(true);
      try {
        const { data, error } = await supabase.functions.invoke('stripe-subscription-manager', {
          body: { action: 'SYNC_SUBSCRIPTION' },
        });

        if (error) throw error;

        if (data.subscription) {
          setSubscriptionDetails({
            subscription_tier: data.subscription.subscription_tier || 'Premium',
            subscription_end: data.subscription.subscription_end,
          });
        }

        // Refresh user status to ensure UI is in sync
        await fetchUserStatus();
      } catch (error) {
        console.error('Error verifying subscription:', error);
        toast({
          variant: "destructive",
          title: "Subscription Verification Failed",
          description: "Could not verify your subscription status. Please try refreshing the page."
        });
      } finally {
        setIsVerifyingSubscription(false);
      }
    };

    verifySubscription();
  }, [fetchUserStatus, toast]);

  const handleUpgradeToPremium = async () => {
    setIsProcessingCheckout(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-subscription-manager', {
        body: { 
          action: 'CREATE_CHECKOUT',
          success_url: '/behavioral',
          cancel_url: '/settings'
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Redirect to Stripe checkout in the same tab
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        variant: "destructive",
        title: "Checkout Failed",
        description: "Could not create checkout session. Please try again."
      });
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-subscription-manager', {
        body: { action: 'CUSTOMER_PORTAL' },
      });

      if (error) throw error;

      if (data?.url) {
        // Open customer portal in a new tab
        window.open(data.url, '_blank');
      } else {
        throw new Error('No portal URL received');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        variant: "destructive",
        title: "Portal Access Failed",
        description: "Could not open subscription management portal. Please try again."
      });
    } finally {
      setIsLoadingPortal(false);
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
          {/* Unified Settings Card */}
          <UnifiedSettingsCard
            isPremium={isPremium}
            isBasic={isBasic}
            isVerifyingSubscription={isVerifyingSubscription}
            subscriptionDetails={subscriptionDetails}
            usageSummary={usageSummary}
            isLoadingUsage={isLoadingUsage}
            isProcessingCheckout={isProcessingCheckout}
            isLoadingPortal={isLoadingPortal}
            tokensLoading={tokensLoading}
            onUpgradeToPremium={handleUpgradeToPremium}
            onManageSubscription={handleManageSubscription}
          />

          {/* Password Settings Card */}
          {user?.provider === 'email' && (
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
          )}
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
