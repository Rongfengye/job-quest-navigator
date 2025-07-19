
import { supabase } from '@/integrations/supabase/client';

export interface LocalSubscriptionData {
  isExpired: boolean;
  needsSync: boolean;
  subscriptionEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

/**
 * Check subscription status locally without calling Stripe API
 * Returns whether subscription is expired and if we need a full sync
 */
export const checkLocalSubscriptionStatus = async (userId: string): Promise<LocalSubscriptionData | null> => {
  try {
    const { data: subscription, error } = await supabase
      .from('stripe_subscriptions')
      .select('current_period_end, cancel_at_period_end, subscription_status, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching local subscription:', error);
      return null;
    }

    if (!subscription) {
      // No subscription record means we need a sync
      return {
        isExpired: true,
        needsSync: true,
        subscriptionEnd: null,
        cancelAtPeriodEnd: false
      };
    }

    const now = new Date();
    const periodEnd = subscription.current_period_end ? new Date(subscription.current_period_end) : null;
    const isExpired = periodEnd ? now > periodEnd : false;
    
    // Need sync if:
    // 1. Subscription is expired and was set to cancel
    // 2. Data is more than 1 day old
    // 3. Status is not 'active'
    const dataAge = new Date(subscription.updated_at);
    const isDataStale = (now.getTime() - dataAge.getTime()) > (24 * 60 * 60 * 1000); // 24 hours
    
    const needsSync = 
      (isExpired && subscription.cancel_at_period_end) ||
      isDataStale ||
      subscription.subscription_status !== 'active';

    return {
      isExpired,
      needsSync,
      subscriptionEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false
    };

  } catch (error) {
    console.error('Error in checkLocalSubscriptionStatus:', error);
    return null;
  }
};

/**
 * Determine if we should do a full Stripe sync or just local check
 */
export const shouldPerformFullSync = async (userId: string, reason: string): Promise<boolean> => {
  console.log(`🔍 Checking if full sync needed for reason: ${reason}`);
  
  // Always sync for critical reasons
  const criticalReasons = ['app_initialization', 'stripe_portal_return', 'daily_expiration_check'];
  if (criticalReasons.includes(reason)) {
    console.log(`✅ Full sync required for critical reason: ${reason}`);
    return true;
  }

  // For non-critical reasons, check locally first
  const localStatus = await checkLocalSubscriptionStatus(userId);
  if (!localStatus) {
    console.log(`⚠️ No local data available, requiring full sync`);
    return true;
  }

  if (localStatus.needsSync) {
    console.log(`🔄 Local check indicates sync needed:`, localStatus);
    return true;
  }

  console.log(`⚡ Using local data, no sync needed:`, localStatus);
  return false;
};
