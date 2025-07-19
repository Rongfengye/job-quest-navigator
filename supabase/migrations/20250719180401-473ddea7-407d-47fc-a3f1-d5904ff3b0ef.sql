
-- Add unique constraint on user_id to the stripe_subscriptions table
ALTER TABLE public.stripe_subscriptions 
ADD CONSTRAINT stripe_subscriptions_user_id_unique UNIQUE (user_id);
