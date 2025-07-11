
-- Create stripe_subscriptions table to track detailed subscription information
CREATE TABLE public.stripe_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  subscription_status TEXT NOT NULL DEFAULT 'incomplete',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.stripe_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for stripe_subscriptions
CREATE POLICY "Users can view their own subscription data" 
  ON public.stripe_subscriptions 
  FOR SELECT 
  USING (user_id = auth.uid());

-- Service role can manage all subscription data (for edge functions)
CREATE POLICY "Service role can manage subscriptions" 
  ON public.stripe_subscriptions 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_stripe_subscriptions_updated_at
  BEFORE UPDATE ON public.stripe_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster lookups
CREATE INDEX idx_stripe_subscriptions_user_id ON public.stripe_subscriptions(user_id);
CREATE INDEX idx_stripe_subscriptions_customer_id ON public.stripe_subscriptions(stripe_customer_id);
CREATE INDEX idx_stripe_subscriptions_subscription_id ON public.stripe_subscriptions(stripe_subscription_id);
