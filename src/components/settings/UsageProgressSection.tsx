
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, TrendingUp, Calendar } from 'lucide-react';
import PremiumNudge from '@/components/PremiumNudge';

interface UsageData {
  current: number;
  limit: number;
  remaining: number;
}

interface UsageSummary {
  isPremium: boolean;
  behavioral: UsageData;
  questionVault: UsageData;
  billingCycleStart?: string;
  nextResetDate?: string;
  hasActiveTracking?: boolean;
}

interface UsageProgressSectionProps {
  usageSummary: UsageSummary | null;
  isLoadingUsage: boolean;
  isPremium: boolean;
  isBasic: boolean;
}

const UsageProgressSection: React.FC<UsageProgressSectionProps> = ({
  usageSummary,
  isLoadingUsage,
  isPremium,
  isBasic
}) => {
  if (isLoadingUsage) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!usageSummary) {
    return (
      <div className="text-sm text-muted-foreground">
        Unable to load usage information
      </div>
    );
  }

  const getBadgeVariant = (remaining: number, limit: number) => {
    if (limit === -1) return 'default'; // Premium
    const percentage = (remaining / limit) * 100;
    if (percentage <= 10) return 'destructive';
    if (percentage <= 30) return 'secondary';
    return 'default';
  };

  const formatUsageText = (current: number, limit: number) => {
    if (limit === -1) return 'Unlimited';
    return `${current} / ${limit}`;
  };

  const formatResetDate = (dateString?: string) => {
    if (!dateString || isPremium) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Usage resets info */}
      <div className="text-sm text-muted-foreground space-y-1">
        <p>
          {isPremium ? 'You have unlimited usage with Premium' : 'Your monthly limits reset on your billing cycle date'}
        </p>
        {!isPremium && usageSummary?.nextResetDate && (
          <p className="flex items-center gap-1 text-xs">
            <Calendar className="h-3 w-3" />
            Next reset: {formatResetDate(usageSummary.nextResetDate)}
          </p>
        )}
      </div>

      {/* Behavioral Interview Practices */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-blue-500" />
            <span className="font-medium">Behavioral Interview Practices</span>
            {!isPremium && (
              <span className="text-xs text-muted-foreground">
                • Build confidence through practice
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {formatUsageText(usageSummary.behavioral.current, usageSummary.behavioral.limit)}
            </span>
            <Badge variant={getBadgeVariant(usageSummary.behavioral.remaining, usageSummary.behavioral.limit)}>
              {usageSummary.behavioral.limit === -1 ? 'Unlimited' : `${usageSummary.behavioral.remaining} left`}
            </Badge>
          </div>
        </div>
        {usageSummary.behavioral.limit !== -1 && (
          <Progress 
            value={(usageSummary.behavioral.current / usageSummary.behavioral.limit) * 100} 
            className="h-2"
          />
        )}
      </div>

      {/* Question Vault Generations */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="font-medium">Question Vault Generations</span>
            {!isPremium && (
              <span className="text-xs text-muted-foreground">
                • Get targeted interview questions
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {formatUsageText(usageSummary.questionVault.current, usageSummary.questionVault.limit)}
            </span>
            <Badge variant={getBadgeVariant(usageSummary.questionVault.remaining, usageSummary.questionVault.limit)}>
              {usageSummary.questionVault.limit === -1 ? 'Unlimited' : `${usageSummary.questionVault.remaining} left`}
            </Badge>
          </div>
        </div>
        {usageSummary.questionVault.limit !== -1 && (
          <Progress 
            value={(usageSummary.questionVault.current / usageSummary.questionVault.limit) * 100} 
            className="h-2"
          />
        )}
      </div>

      {/* Enhanced Premium Nudge for Basic Users */}
      {isBasic && (usageSummary.behavioral.remaining <= 2 || usageSummary.questionVault.remaining === 0) && (
        <PremiumNudge variant="usage-enhancement" />
      )}
    </div>
  );
};

export default UsageProgressSection;
