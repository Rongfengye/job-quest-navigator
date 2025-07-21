
-- Phase 1: Add custom_premium column to hireme_user_status table
ALTER TABLE public.hireme_user_status 
ADD COLUMN custom_premium INTEGER NOT NULL DEFAULT 0;

-- Update the initialize_user_status function to include custom_premium
CREATE OR REPLACE FUNCTION public.initialize_user_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.hireme_user_status (user_id, user_plan_status, custom_premium)
  VALUES (NEW.id, 0, 0);
  RETURN NEW;
END;
$function$;

-- Add a comment to document the new column
COMMENT ON COLUMN public.hireme_user_status.custom_premium IS 'Manual override for premium status: 0 = disabled, 1 = enabled. When set to 1, user gets premium features regardless of Stripe subscription status.';
