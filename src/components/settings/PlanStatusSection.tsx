
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown, User, Loader2 } from 'lucide-react';

interface PlanStatusSectionProps {
  isPremium: boolean;
  isVerifyingSubscription: boolean;
  subscriptionDetails?: {
    subscription_tier?: string;
    subscription_end?: string;
  } | null;
}

const PlanStatusSection: React.FC<PlanStatusSectionProps> = ({
  isPremium,
  isVerifyingSubscription,
  subscriptionDetails
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        {isPremium ? (
          <>
            <Crown className="h-6 w-6 text-yellow-500" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-semibold">Premium Plan</span>
                <Badge variant="default" className="bg-yellow-500 text-white">
                  {subscriptionDetails?.subscription_tier || 'Premium'}
                </Badge>
                {isVerifyingSubscription && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Unlimited access to all features
              </p>
              {subscriptionDetails?.subscription_end && (
                <p className="text-xs text-muted-foreground mt-1">
                  Renews on {formatDate(subscriptionDetails.subscription_end)}
                </p>
              )}
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
                {isVerifyingSubscription && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Limited access to features
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PlanStatusSection;
