
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, User, RefreshCw, AlertCircle } from 'lucide-react';
import { useUserTokens } from '@/hooks/useUserTokens';
import { useSubscriptionManager } from '@/hooks/useSubscriptionManager';

interface SubscriptionStatusBadgeProps {
  showRefreshButton?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

const SubscriptionStatusBadge: React.FC<SubscriptionStatusBadgeProps> = ({ 
  showRefreshButton = false,
  size = 'default'
}) => {
  const { isPremium, isBasic, isLoading } = useUserTokens();
  const { manualSync, isLoading: isSyncing } = useSubscriptionManager();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="animate-pulse">
          Loading...
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isPremium ? (
        <div className="flex items-center gap-1">
          <Crown className="h-4 w-4 text-yellow-500" />
          <Badge variant="default" className="bg-yellow-500 text-white">
            Premium
          </Badge>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <User className="h-4 w-4 text-gray-500" />
          <Badge variant="secondary">
            Free
          </Badge>
        </div>
      )}
      
      {showRefreshButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={manualSync}
          disabled={isSyncing}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
        </Button>
      )}
    </div>
  );
};

export default SubscriptionStatusBadge;
