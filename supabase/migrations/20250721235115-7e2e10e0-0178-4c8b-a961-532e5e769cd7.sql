-- Phase 2: Update database functions to respect custom_premium

-- Update make_user_premium() - Skip update if custom_premium = 1
CREATE OR REPLACE FUNCTION public.make_user_premium(user_id uuid, amount integer DEFAULT 1)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  new_balance INTEGER;
  current_custom_premium INTEGER;
BEGIN
  -- Check if user has custom_premium enabled
  SELECT custom_premium INTO current_custom_premium
  FROM public.hireme_user_status
  WHERE hireme_user_status.user_id = $1;
  
  -- If custom_premium is 1, don't modify anything - they stay premium
  IF current_custom_premium = 1 THEN
    RETURN 1; -- Return 1 to indicate premium status
  END IF;
  
  -- For the binary system, any positive amount sets to 1 (premium)
  -- Zero or negative sets to 0 (basic)
  IF amount > 0 THEN
    new_balance := 1;
  ELSE
    new_balance := 0;
  END IF;
  
  UPDATE public.hireme_user_status
  SET user_plan_status = new_balance,
      updated_at = now()
  WHERE hireme_user_status.user_id = $1;
  
  RETURN new_balance;
END;
$function$;

-- Update make_user_basic() - Skip downgrade if custom_premium = 1
CREATE OR REPLACE FUNCTION public.make_user_basic(user_id uuid, amount integer DEFAULT 1)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  new_balance INTEGER;
  existing_usage_record RECORD;
  current_custom_premium INTEGER;
BEGIN
  -- Check if user has custom_premium enabled
  SELECT custom_premium INTO current_custom_premium
  FROM public.hireme_user_status
  WHERE hireme_user_status.user_id = $1;
  
  -- If custom_premium is 1, don't downgrade - they stay premium
  IF current_custom_premium = 1 THEN
    RETURN 1; -- Return 1 to indicate they remain premium
  END IF;
  
  -- In binary system, any deduction sets user to basic (0)
  new_balance := 0;
  
  UPDATE public.hireme_user_status
  SET user_plan_status = new_balance,
      updated_at = now()
  WHERE hireme_user_status.user_id = $1;
  
  -- When user becomes basic, start their usage tracking
  -- Check if they already have a current billing cycle
  SELECT * INTO existing_usage_record
  FROM public.storyline_user_monthly_usage
  WHERE storyline_user_monthly_usage.user_id = $1 
  ORDER BY billing_cycle_start_date DESC
  LIMIT 1;
  
  -- If no record exists OR the existing record is from an old cycle, create a new one
  IF existing_usage_record IS NULL OR 
     CURRENT_DATE >= existing_usage_record.billing_cycle_start_date + INTERVAL '30 days' THEN
    INSERT INTO public.storyline_user_monthly_usage (user_id, billing_cycle_start_date)
    VALUES ($1, CURRENT_DATE)
    ON CONFLICT (user_id, billing_cycle_start_date) DO NOTHING;
  END IF;
  
  RETURN new_balance;
END;
$function$;

-- Update increment_user_monthly_usage() to check (user_plan_status = 1 OR custom_premium = 1)
CREATE OR REPLACE FUNCTION public.increment_user_monthly_usage(user_id uuid, usage_type text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  usage_record RECORD;
  is_premium BOOLEAN;
  current_cycle_start DATE;
BEGIN
  -- Check if user is premium (either through plan status OR custom premium)
  SELECT (user_plan_status = 1 OR custom_premium = 1) INTO is_premium
  FROM public.hireme_user_status
  WHERE hireme_user_status.user_id = $1;
  
  -- Premium users don't need usage tracking
  IF is_premium THEN
    RETURN json_build_object(
      'success', true,
      'isPremium', true,
      'newCount', 0
    );
  END IF;
  
  -- Find the most recent billing cycle for this user
  SELECT * INTO usage_record
  FROM public.storyline_user_monthly_usage
  WHERE storyline_user_monthly_usage.user_id = $1 
  ORDER BY billing_cycle_start_date DESC
  LIMIT 1;
  
  -- If no record exists, create one (this should happen when user becomes basic)
  IF usage_record IS NULL THEN
    INSERT INTO public.storyline_user_monthly_usage (user_id, billing_cycle_start_date)
    VALUES ($1, CURRENT_DATE)
    RETURNING * INTO usage_record;
  END IF;
  
  -- Check if we need to start a new billing cycle (30 days)
  current_cycle_start := usage_record.billing_cycle_start_date;
  IF CURRENT_DATE >= current_cycle_start + INTERVAL '30 days' THEN
    -- Create a new billing cycle
    INSERT INTO public.storyline_user_monthly_usage (user_id, billing_cycle_start_date)
    VALUES ($1, CURRENT_DATE)
    RETURNING * INTO usage_record;
  END IF;
  
  -- Increment the appropriate counter
  IF usage_type = 'behavioral' THEN
    UPDATE public.storyline_user_monthly_usage
    SET behavioral_practices_count = behavioral_practices_count + 1,
        updated_at = now()
    WHERE storyline_user_monthly_usage.user_id = $1 
      AND billing_cycle_start_date = usage_record.billing_cycle_start_date
    RETURNING behavioral_practices_count INTO usage_record.behavioral_practices_count;
  ELSIF usage_type = 'question_vault' THEN
    UPDATE public.storyline_user_monthly_usage
    SET question_vaults_count = question_vaults_count + 1,
        updated_at = now()
    WHERE storyline_user_monthly_usage.user_id = $1 
      AND billing_cycle_start_date = usage_record.billing_cycle_start_date
    RETURNING question_vaults_count INTO usage_record.question_vaults_count;
  ELSE
    RAISE EXCEPTION 'Invalid usage_type. Must be "behavioral" or "question_vault"';
  END IF;
  
  -- Return success with new count
  RETURN json_build_object(
    'success', true,
    'isPremium', false,
    'newCount', CASE 
      WHEN usage_type = 'behavioral' THEN usage_record.behavioral_practices_count
      WHEN usage_type = 'question_vault' THEN usage_record.question_vaults_count
    END,
    'billingCycleStart', usage_record.billing_cycle_start_date,
    'nextResetDate', usage_record.billing_cycle_start_date + INTERVAL '30 days'
  );
END;
$function$;

-- Update ensure_user_usage_record() to check (user_plan_status = 1 OR custom_premium = 1)
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
  -- Check if user is premium (either through plan status OR custom premium)
  SELECT (user_plan_status = 1 OR custom_premium = 1) INTO is_premium
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

-- Update check_user_monthly_usage() to check (user_plan_status = 1 OR custom_premium = 1)
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
  -- Check if user is premium (either through plan status OR custom premium)
  SELECT (user_plan_status = 1 OR custom_premium = 1) INTO is_premium
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

-- Update get_user_monthly_usage_summary() to check (user_plan_status = 1 OR custom_premium = 1)
CREATE OR REPLACE FUNCTION public.get_user_monthly_usage_summary(user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  usage_record RECORD;
  is_premium BOOLEAN;
  current_cycle_start DATE;
BEGIN
  -- Check if user is premium (either through plan status OR custom premium)
  SELECT (user_plan_status = 1 OR custom_premium = 1) INTO is_premium
  FROM public.hireme_user_status
  WHERE hireme_user_status.user_id = $1;
  
  -- Premium users have unlimited access
  IF is_premium THEN
    RETURN json_build_object(
      'isPremium', true,
      'behavioral', json_build_object(
        'current', 0,
        'limit', -1,
        'remaining', -1
      ),
      'questionVault', json_build_object(
        'current', 0,
        'limit', -1,
        'remaining', -1
      )
    );
  END IF;
  
  -- Find the most recent billing cycle for this user
  SELECT * INTO usage_record
  FROM public.storyline_user_monthly_usage
  WHERE storyline_user_monthly_usage.user_id = $1 
  ORDER BY billing_cycle_start_date DESC
  LIMIT 1;
  
  -- If no record exists, return zero usage (user hasn't started tracking yet)
  IF usage_record IS NULL THEN
    RETURN json_build_object(
      'isPremium', false,
      'behavioral', json_build_object(
        'current', 0,
        'limit', 5,
        'remaining', 5
      ),
      'questionVault', json_build_object(
        'current', 0,
        'limit', 1,
        'remaining', 1
      ),
      'hasActiveTracking', false
    );
  END IF;
  
  -- Check if we need to start a new billing cycle
  current_cycle_start := usage_record.billing_cycle_start_date;
  IF CURRENT_DATE >= current_cycle_start + INTERVAL '30 days' THEN
    -- Usage should reset, return fresh limits
    RETURN json_build_object(
      'isPremium', false,
      'behavioral', json_build_object(
        'current', 0,
        'limit', 5,
        'remaining', 5
      ),
      'questionVault', json_build_object(
        'current', 0,
        'limit', 1,
        'remaining', 1
      ),
      'billingCycleStart', current_cycle_start,
      'nextResetDate', current_cycle_start + INTERVAL '30 days',
      'needsReset', true
    );
  END IF;
  
  -- Return current usage summary
  RETURN json_build_object(
    'isPremium', false,
    'behavioral', json_build_object(
      'current', usage_record.behavioral_practices_count,
      'limit', 5,
      'remaining', GREATEST(0, 5 - usage_record.behavioral_practices_count)
    ),
    'questionVault', json_build_object(
      'current', usage_record.question_vaults_count,
      'limit', 1,
      'remaining', GREATEST(0, 1 - usage_record.question_vaults_count)
    ),
    'billingCycleStart', usage_record.billing_cycle_start_date,
    'nextResetDate', usage_record.billing_cycle_start_date + INTERVAL '30 days'
  );
END;
$function$;