
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';
import PlanStatusSection from './PlanStatusSection';
import UsageProgressSection from './UsageProgressSection';
import PremiumFeaturesSection from './PremiumFeaturesSection';

interface UsageData {
  current: number;
  limit: number;
  remaining: number;
}

interface UsageSummary {
  isPremium: boolean;
  behavioral: UsageData;
  questionVault: UsageData;
}

interface UnifiedSettingsCardProps {
  isPremium: boolean;
  isBasic: boolean;
  isVerifyingSubscription: boolean;
  subscriptionDetails?: {
    subscription_tier?: string;
    subscription_end?: string;
  } | null;
  usageSummary: UsageSummary | null;
  isLoadingUsage: boolean;
  isProcessingCheckout: boolean;
  isLoadingPortal: boolean;
  tokensLoading: boolean;
  onUpgradeToPremium: () => void;
  onManageSubscription: () => void;
}

const UnifiedSettingsCard: React.FC<UnifiedSettingsCardProps> = ({
  isPremium,
  isBasic,
  isVerifyingSubscription,
  subscriptionDetails,
  usageSummary,
  isLoadingUsage,
  isProcessingCheckout,
  isLoadingPortal,
  tokensLoading,
  onUpgradeToPremium,
  onManageSubscription
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Account & Usage
        </CardTitle>
        <CardDescription>
          Manage your subscription plan and track your monthly usage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Section A: Plan Status */}
        <div>
          <PlanStatusSection
            isPremium={isPremium}
            isVerifyingSubscription={isVerifyingSubscription}
            subscriptionDetails={subscriptionDetails}
          />
        </div>

        {/* Section B: Usage & Acceleration */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Monthly Usage</h3>
          <UsageProgressSection
            usageSummary={usageSummary}
            isLoadingUsage={isLoadingUsage}
            isPremium={isPremium}
            isBasic={isBasic}
          />
        </div>

        {/* Section C: Premium Features & Actions */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            {isPremium ? 'Subscription Management' : 'Upgrade Your Experience'}
          </h3>
          <PremiumFeaturesSection
            isBasic={isBasic}
            isPremium={isPremium}
            isProcessingCheckout={isProcessingCheckout}
            isLoadingPortal={isLoadingPortal}
            tokensLoading={tokensLoading}
            onUpgradeToPremium={onUpgradeToPremium}
            onManageSubscription={onManageSubscription}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default UnifiedSettingsCard;
