
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useUserTokens } from '@/hooks/useUserTokens';
import { Crown, User, TrendingUp, MessageSquare, Calendar } from 'lucide-react';
import PremiumNudge from './PremiumNudge';

const UsageDisplay = () => {
  const { usageSummary, isLoadingUsage, isPremium, isBasic } = useUserTokens();

  if (isLoadingUsage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Usage</CardTitle>
          <CardDescription>Loading your usage information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!usageSummary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Usage</CardTitle>
          <CardDescription>Unable to load usage information</CardDescription>
        </CardHeader>
      </Card>
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Usage
            </CardTitle>
            <CardDescription className="flex flex-col gap-1">
              {isPremium ? (
                'Unlimited usage with Premium'
              ) : (
                <>
                  <span>Your monthly limits reset on your billing cycle date</span>
                  {usageSummary?.nextResetDate && (
                    <span className="flex items-center gap-1 text-xs">
                      <Calendar className="h-3 w-3" />
                      Next reset: {formatResetDate(usageSummary.nextResetDate)}
                    </span>
                  )}
                </>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isPremium ? (
              <>
                <Crown className="h-4 w-4 text-yellow-500" />
                <Badge variant="default" className="bg-yellow-500 text-white">
                  Premium
                </Badge>
              </>
            ) : (
              <>
                <User className="h-4 w-4 text-gray-500" />
                <Badge variant="secondary">
                  Basic
                </Badge>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
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
      </CardContent>
    </Card>
  );
};

export default UsageDisplay;
