-- Create a function to ensure a user has a usage record
-- This is useful for existing users who may not have gone through the normal flow
CREATE OR REPLACE FUNCTION public.ensure_user_usage_record(user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  usage_record RECORD;
  is_premium BOOLEAN;
  current_cycle_start DATE;
BEGIN
  -- Check if user is premium (premium users don't need usage tracking)
  SELECT user_plan_status = 1 INTO is_premium
  FROM public.hireme_user_status
  WHERE hireme_user_status.user_id = $1;
  
  -- Premium users don't need usage records
  IF is_premium THEN
    RETURN json_build_object(
      'success', true,
      'isPremium', true,
      'message', 'Premium user - no usage record needed'
    );
  END IF;
  
  -- Check if user already has a current usage record
  SELECT * INTO usage_record
  FROM public.storyline_user_monthly_usage
  WHERE storyline_user_monthly_usage.user_id = $1 
  ORDER BY billing_cycle_start_date DESC
  LIMIT 1;
  
  -- If no record exists, create one
  IF usage_record IS NULL THEN
    INSERT INTO public.storyline_user_monthly_usage (user_id, billing_cycle_start_date)
    VALUES ($1, CURRENT_DATE)
    RETURNING * INTO usage_record;
    
    RETURN json_build_object(
      'success', true,
      'isPremium', false,
      'message', 'Created new usage record',
      'billingCycleStart', usage_record.billing_cycle_start_date,
      'nextResetDate', usage_record.billing_cycle_start_date + INTERVAL '30 days'
    );
  END IF;
  
  -- Check if current record is expired and needs a new cycle
  current_cycle_start := usage_record.billing_cycle_start_date;
  IF CURRENT_DATE >= current_cycle_start + INTERVAL '30 days' THEN
    -- Create a new billing cycle
    INSERT INTO public.storyline_user_monthly_usage (user_id, billing_cycle_start_date)
    VALUES ($1, CURRENT_DATE)
    RETURNING * INTO usage_record;
    
    RETURN json_build_object(
      'success', true,
      'isPremium', false,
      'message', 'Created new billing cycle',
      'billingCycleStart', usage_record.billing_cycle_start_date,
      'nextResetDate', usage_record.billing_cycle_start_date + INTERVAL '30 days'
    );
  END IF;
  
  -- User already has a current usage record
  RETURN json_build_object(
    'success', true,
    'isPremium', false,
    'message', 'Usage record already exists',
    'billingCycleStart', usage_record.billing_cycle_start_date,
    'nextResetDate', usage_record.billing_cycle_start_date + INTERVAL '30 days'
  );
END;
$function$;