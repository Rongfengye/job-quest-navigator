import React from 'react';
import { usePlanStatus } from '@/hooks/usePlanStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Star, User } from 'lucide-react';

export const CustomPremiumStatus: React.FC = () => {
  const { planStatus, customPremium, isPremium, isBasic, isLoading } = usePlanStatus();

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="animate-pulse text-center">Loading status...</div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    if (customPremium === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (isPremium) return <Star className="w-5 h-5 text-blue-500" />;
    return <User className="w-5 h-5 text-gray-500" />;
  };

  const getStatusBadge = () => {
    if (customPremium === 1) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Custom Premium</Badge>;
    }
    if (isPremium) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Premium (Stripe)</Badge>;
    }
    return <Badge variant="outline">Basic</Badge>;
  };

  const getStatusDescription = () => {
    if (customPremium === 1) {
      return "You have custom premium access granted manually. This overrides your Stripe subscription status.";
    }
    if (isPremium) {
      return "You have premium access through your active Stripe subscription.";
    }
    return "You're on the basic plan. Upgrade to premium for unlimited access.";
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Plan Status Debug
        </CardTitle>
        <CardDescription>
          Current subscription and custom premium status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Overall Status:</span>
          {getStatusBadge()}
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Plan Status:</span>
            <span className="font-mono">{planStatus ?? 'null'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Custom Premium:</span>
            <span className="font-mono">{customPremium ?? 'null'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Is Premium:</span>
            <span className="font-mono">{isPremium.toString()}</span>
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            {getStatusDescription()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};