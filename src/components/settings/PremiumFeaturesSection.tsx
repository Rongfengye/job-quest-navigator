
import React from 'react';
import { Button } from '@/components/ui/button';
import { TrendingUp, ExternalLink, Loader2 } from 'lucide-react';

interface PremiumFeaturesSectionProps {
  isBasic: boolean;
  isPremium: boolean;
  isProcessingCheckout: boolean;
  isLoadingPortal: boolean;
  tokensLoading: boolean;
  subscriptionEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  onUpgradeToPremium: () => void;
  onManageSubscription: () => void;
}

const PremiumFeaturesSection: React.FC<PremiumFeaturesSectionProps> = ({
  isBasic,
  isPremium,
  isProcessingCheckout,
  isLoadingPortal,
  tokensLoading,
  subscriptionEnd,
  cancelAtPeriodEnd,
  onUpgradeToPremium,
  onManageSubscription
}) => {
  const formatExpirationDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  return (
    <div className="space-y-4">
      {/* Premium Features Info - Always show for context */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">
          {isPremium ? 'Your Premium Features:' : 'Premium Features Include:'}
        </h4>
        <ul className="text-sm text-blue-800 space-y-1 mb-4">
          <li>• Unlimited behavioral interviews practice</li>
          <li>• Unlimited tailored question generations</li>
          <li>• Priority support to any feedback or concerns you have</li>
        </ul>
        
        {/* Phase 2: Enhanced subscription details */}
        {isPremium && subscriptionEnd && (
          <div className="text-sm text-blue-700 mb-4 p-2 bg-blue-100 rounded">
            <p>
              <strong>Subscription expires:</strong> {formatExpirationDate(subscriptionEnd)}
              {cancelAtPeriodEnd && <span className="text-orange-600"> (will not renew)</span>}
            </p>
          </div>
        )}
        
        {/* Action Buttons inside the features box */}
        <div className="flex flex-col sm:flex-row gap-3">
          {isBasic ? (
            <Button 
              onClick={onUpgradeToPremium}
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
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Upgrade to Premium - $0.50/month
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={onManageSubscription}
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
      </div>
    </div>
  );
};

export default PremiumFeaturesSection;
