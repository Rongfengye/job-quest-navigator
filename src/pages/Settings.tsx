import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useAuthContext } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useUserTokens } from '@/hooks/useUserTokens';
import { Crown, User, Key, CreditCard, ExternalLink, Loader2, MessageSquare, TrendingUp } from 'lucide-react';
import UsageDisplay from '@/components/UsageDisplay';
import PasswordChangeModal from '@/components/settings/PasswordChangeModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import PremiumNudge from '@/components/PremiumNudge';

const Settings = () => {
  const { logout, user } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  const { isPremium, isBasic, isLoading: tokensLoading, fetchUserStatus } = useUserTokens();
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<{
    subscription_tier?: string;
    subscription_end?: string;
  } | null>(null);
  const [isVerifyingSubscription, setIsVerifyingSubscription] = useState(false);
  const [usageSummary, setUsageSummary] = useState<{
    behavioral: { current: number; limit: number; remaining: number };
    questionVault: { current: number; limit: number; remaining: number };
  } | null>(null);
  
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

  useEffect(() => {
    const fetchUsageSummary = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('usage-summary', {
          body: { action: 'GET_SUMMARY' },
        });

        if (error) throw error;

        if (data.summary) {
          setUsageSummary(data.summary);
        }
      } catch (error) {
        console.error('Error fetching usage summary:', error);
        toast({
          variant: "destructive",
          title: "Usage Summary Failed",
          description: "Could not load usage summary. Please try again."
        });
      }
    };

    fetchUsageSummary();
  }, [toast]);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-interview-primary">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account settings</p>
        </div>
        
        <div className="grid gap-6">
          {/* Unified Subscription & Usage Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                <CardTitle>Settings & Plan</CardTitle>
                {isVerifyingSubscription && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <CardDescription>
                Manage your subscription, usage, and billing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Top: Plan Info */}
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <User className="h-6 w-6 text-gray-500" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-semibold">Free Plan</span>
                    <Badge variant="secondary">Basic</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Limited access to features</p>
                </div>
              </div>

              {/* Middle: Usage Progress Bars & Nudge */}
              <div className="space-y-6">
                {/* Usage Progress Bars (from UsageDisplay) */}
                {/* Behavioral Interview Practices */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Behavioral Interview Practices</span>
                      {!isPremium && (
                        <span className="text-xs text-muted-foreground">• Build confidence through practice</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {usageSummary ? `${usageSummary.behavioral.current} / ${usageSummary.behavioral.limit}` : '--'}
                      </span>
                      <Badge variant={usageSummary ? (usageSummary.behavioral.remaining / usageSummary.behavioral.limit <= 0.1 ? 'destructive' : usageSummary.behavioral.remaining / usageSummary.behavioral.limit <= 0.3 ? 'secondary' : 'default') : 'default'}>
                        {usageSummary ? (usageSummary.behavioral.limit === -1 ? 'Unlimited' : `${usageSummary.behavioral.remaining} left`) : '--'}
                      </Badge>
                    </div>
                  </div>
                  {usageSummary && usageSummary.behavioral.limit !== -1 && (
                    <Progress value={(usageSummary.behavioral.current / usageSummary.behavioral.limit) * 100} className="h-2" />
                  )}
                </div>
                {/* Question Vault Generations */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Question Vault Generations</span>
                      {!isPremium && (
                        <span className="text-xs text-muted-foreground">• Get targeted interview questions</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {usageSummary ? `${usageSummary.questionVault.current} / ${usageSummary.questionVault.limit}` : '--'}
                      </span>
                      <Badge variant={usageSummary ? (usageSummary.questionVault.remaining / usageSummary.questionVault.limit <= 0.1 ? 'destructive' : usageSummary.questionVault.remaining / usageSummary.questionVault.limit <= 0.3 ? 'secondary' : 'default') : 'default'}>
                        {usageSummary ? (usageSummary.questionVault.limit === -1 ? 'Unlimited' : `${usageSummary.questionVault.remaining} left`) : '--'}
                      </Badge>
                    </div>
                  </div>
                  {usageSummary && usageSummary.questionVault.limit !== -1 && (
                    <Progress value={(usageSummary.questionVault.current / usageSummary.questionVault.limit) * 100} className="h-2" />
                  )}
                </div>
                {/* Accelerate Your Interview Success Nudge */}
                {isBasic && (
                  <PremiumNudge variant="usage-enhancement" />
                )}
              </div>

              {/* Bottom: Premium Features */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Premium Features Include:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Unlimited behavioral interview practices</li>
                  <li>• Unlimited question vault generations</li>
                  <li>• Priority support</li>
                  <li>• Advanced feedback and insights</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
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
              </div>
            </CardContent>
          </Card>

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
