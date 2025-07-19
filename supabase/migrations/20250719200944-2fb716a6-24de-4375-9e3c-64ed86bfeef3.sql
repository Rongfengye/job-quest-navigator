
-- Update check_user_monthly_usage function to automatically create usage records for basic users
CREATE OR REPLACE FUNCTION public.check_user_monthly_usage(user_id uuid, usage_type text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  usage_record RECORD;
  current_count INTEGER;
  limit_count INTEGER;
  is_premium BOOLEAN;
  current_cycle_start DATE;
BEGIN
  -- Check if user is premium
  SELECT user_plan_status = 1 INTO is_premium
  FROM public.hireme_user_status
  WHERE hireme_user_status.user_id = $1;
  
  -- Premium users have unlimited access
  IF is_premium THEN
    RETURN json_build_object(
      'canProceed', true,
      'isPremium', true,
      'currentCount', 0,
      'limit', -1,
      'remaining', -1
    );
  END IF;
  
  -- Find the most recent billing cycle for this user
  SELECT * INTO usage_record
  FROM public.storyline_user_monthly_usage
  WHERE storyline_user_monthly_usage.user_id = $1 
  ORDER BY billing_cycle_start_date DESC
  LIMIT 1;
  
  -- If no record exists, create one automatically (fallback for existing users)
  IF usage_record IS NULL THEN
    INSERT INTO public.storyline_user_monthly_usage (user_id, billing_cycle_start_date)
    VALUES ($1, CURRENT_DATE)
    RETURNING * INTO usage_record;
  END IF;
  
  -- Check if we're still within the current billing cycle (30 days)
  current_cycle_start := usage_record.billing_cycle_start_date;
  IF CURRENT_DATE >= current_cycle_start + INTERVAL '30 days' THEN
    -- Need to create a new billing cycle
    INSERT INTO public.storyline_user_monthly_usage (user_id, billing_cycle_start_date)
    VALUES ($1, CURRENT_DATE)
    RETURNING * INTO usage_record;
  END IF;
  
  -- Set limits and get current count based on usage type
  IF usage_type = 'behavioral' THEN
    current_count := usage_record.behavioral_practices_count;
    limit_count := 5;
  ELSIF usage_type = 'question_vault' THEN
    current_count := usage_record.question_vaults_count;
    limit_count := 1;
  ELSE
    RAISE EXCEPTION 'Invalid usage_type. Must be "behavioral" or "question_vault"';
  END IF;
  
  -- Return usage information
  RETURN json_build_object(
    'canProceed', current_count < limit_count,
    'isPremium', false,
    'currentCount', current_count,
    'limit', limit_count,
    'remaining', GREATEST(0, limit_count - current_count),
    'billingCycleStart', current_cycle_start,
    'nextResetDate', current_cycle_start + INTERVAL '30 days'
  );
END;
$function$;
