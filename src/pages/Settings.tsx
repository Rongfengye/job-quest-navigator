import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useAuthContext } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useUserTokens } from '@/hooks/useUserTokens';
import { useSubscriptionManager } from '@/hooks/useSubscriptionManager';
import { Crown, User, Key, CreditCard, ExternalLink, Loader2, RefreshCw, AlertCircle, Calendar } from 'lucide-react';
import UsageDisplay from '@/components/UsageDisplay';
import PasswordChangeModal from '@/components/settings/PasswordChangeModal';
import SubscriptionStatusBadge from '@/components/SubscriptionStatusBadge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

const Settings = () => {
  const { logout } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  const { isPremium, isBasic, isLoading: tokensLoading, fetchUserStatus } = useUserTokens();
  const { manualSync } = useSubscriptionManager();
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<{
    subscription_tier?: string;
    subscription_end?: string;
    cancel_at_period_end?: boolean;
    subscription_status?: string;
  } | null>(null);
  const [isVerifyingSubscription, setIsVerifyingSubscription] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
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
            cancel_at_period_end: data.subscription.cancel_at_period_end,
            subscription_status: data.subscription.status,
          });
        }

        setLastSyncTime(new Date());
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

  const handleRefreshStatus = async () => {
    setIsVerifyingSubscription(true);
    try {
      await manualSync();
      setLastSyncTime(new Date());
      toast({
        title: "Status Refreshed",
        description: "Your subscription status has been updated.",
      });
    } catch (error) {
      console.error('Error refreshing status:', error);
      toast({
        variant: "destructive",
        title: "Refresh Failed",
        description: "Could not refresh subscription status. Please try again."
      });
    } finally {
      setIsVerifyingSubscription(false);
    }
  };

  const handleUpgradeToPremium = async () => {
    setIsProcessingCheckout(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-subscription-manager', {
        body: { action: 'CREATE_CHECKOUT' },
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSubscriptionStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'past_due': return 'text-orange-600';
      case 'canceled': return 'text-red-600';
      case 'incomplete': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getSubscriptionStatusText = (status?: string, cancelAtPeriodEnd?: boolean) => {
    if (cancelAtPeriodEnd && status === 'active') {
      return 'Cancels at period end';
    }
    switch (status) {
      case 'active': return 'Active';
      case 'past_due': return 'Payment past due';
      case 'canceled': return 'Canceled';
      case 'incomplete': return 'Incomplete payment';
      default: return 'Unknown';
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

          {/* Subscription Plan Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription Plan
                {isVerifyingSubscription && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                Manage your subscription and billing
                {lastSyncTime && (
                  <span className="text-xs text-muted-foreground">
                    • Last updated {lastSyncTime.toLocaleTimeString()}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Plan Status */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {isPremium ? (
                    <>
                      <Crown className="h-6 w-6 text-yellow-500" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-semibold">Premium Plan</span>
                          <SubscriptionStatusBadge />
                          {subscriptionDetails?.subscription_status && (
                            <Badge 
                              variant="outline" 
                              className={getSubscriptionStatusColor(subscriptionDetails.subscription_status)}
                            >
                              {getSubscriptionStatusText(
                                subscriptionDetails.subscription_status, 
                                subscriptionDetails.cancel_at_period_end
                              )}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Unlimited access to all features
                        </p>
                        {subscriptionDetails?.subscription_end && (
                          <div className="flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              {subscriptionDetails.cancel_at_period_end ? 'Expires' : 'Renews'} on {formatDate(subscriptionDetails.subscription_end)}
                            </p>
                          </div>
                        )}
                        {subscriptionDetails?.subscription_status === 'past_due' && (
                          <div className="flex items-center gap-1 mt-2 p-2 bg-orange-50 border border-orange-200 rounded">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <p className="text-xs text-orange-800">
                              Payment failed. Please update your payment method to continue premium access.
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <User className="h-6 w-6 text-gray-500" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-semibold">Free Plan</span>
                          <SubscriptionStatusBadge />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Limited access to features
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshStatus}
                  disabled={isVerifyingSubscription}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isVerifyingSubscription ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {isBasic ? (
                  <Button 
                    onClick={handleUpgradeToPremium}
                    disabled={isProcessingCheckout || tokensLoading}
                    className="flex-1"
                    size="lg"
                  >
                    {isProcessingCheckout ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade to Premium - $0.50/month
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleManageSubscription}
                    disabled={isLoadingPortal || tokensLoading}
                    variant="outline"
                    className="flex-1"
                    size="lg"
                  >
                    {isLoadingPortal ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Manage Subscription
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Premium Features Info */}
              {isBasic && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Premium Features Include:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Unlimited behavioral interview practices</li>
                    <li>• Unlimited question vault generations</li>
                    <li>• Priority support</li>
                    <li>• Advanced feedback and insights</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Password Settings Card */}
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
