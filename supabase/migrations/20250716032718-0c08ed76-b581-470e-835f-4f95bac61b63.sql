
-- Update the monthly usage limit for behavioral practices from 10 to 5
CREATE OR REPLACE FUNCTION public.check_user_monthly_usage(user_id uuid, usage_type text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_month TEXT;
  usage_record RECORD;
  current_count INTEGER;
  limit_count INTEGER;
  is_premium BOOLEAN;
BEGIN
  -- Get current month in YYYY-MM format
  current_month := to_char(NOW(), 'YYYY-MM');
  
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
  
  -- Get or create usage record for current month
  SELECT * INTO usage_record
  FROM public.storyline_user_monthly_usage
  WHERE storyline_user_monthly_usage.user_id = $1 
    AND month_year = current_month;
  
  -- If no record exists, create it
  IF usage_record IS NULL THEN
    INSERT INTO public.storyline_user_monthly_usage (user_id, month_year)
    VALUES ($1, current_month)
    RETURNING * INTO usage_record;
  END IF;
  
  -- Set limits and get current count based on usage type
  IF usage_type = 'behavioral' THEN
    current_count := usage_record.behavioral_practices_count;
    limit_count := 5; -- Changed from 10 to 5
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
    'remaining', GREATEST(0, limit_count - current_count)
  );
END;
$$;

-- Update the usage summary function as well
CREATE OR REPLACE FUNCTION public.get_user_monthly_usage_summary(user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_month TEXT;
  usage_record RECORD;
  is_premium BOOLEAN;
BEGIN
  -- Get current month in YYYY-MM format
  current_month := to_char(NOW(), 'YYYY-MM');
  
  -- Check if user is premium
  SELECT user_plan_status = 1 INTO is_premium
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
  
  -- Get usage record for current month
  SELECT * INTO usage_record
  FROM public.storyline_user_monthly_usage
  WHERE storyline_user_monthly_usage.user_id = $1 
    AND month_year = current_month;
  
  -- If no record exists, return zero usage
  IF usage_record IS NULL THEN
    RETURN json_build_object(
      'isPremium', false,
      'behavioral', json_build_object(
        'current', 0,
        'limit', 5, -- Changed from 10 to 5
        'remaining', 5 -- Changed from 10 to 5
      ),
      'questionVault', json_build_object(
        'current', 0,
        'limit', 1,
        'remaining', 1
      )
    );
  END IF;
  
  -- Return current usage summary
  RETURN json_build_object(
    'isPremium', false,
    'behavioral', json_build_object(
      'current', usage_record.behavioral_practices_count,
      'limit', 5, -- Changed from 10 to 5
      'remaining', GREATEST(0, 5 - usage_record.behavioral_practices_count) -- Changed from 10 to 5
    ),
    'questionVault', json_build_object(
      'current', usage_record.question_vaults_count,
      'limit', 1,
      'remaining', GREATEST(0, 1 - usage_record.question_vaults_count)
    )
  );
END;
$$;
