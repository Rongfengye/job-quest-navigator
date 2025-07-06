
-- Create the storyline_user_monthly_usage table
CREATE TABLE public.storyline_user_monthly_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- Format: 'YYYY-MM' (e.g., '2025-01')
  behavioral_practices_count INTEGER NOT NULL DEFAULT 0,
  question_vaults_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one record per user per month
  UNIQUE(user_id, month_year)
);

-- Enable RLS
ALTER TABLE public.storyline_user_monthly_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own usage" 
  ON public.storyline_user_monthly_usage 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" 
  ON public.storyline_user_monthly_usage 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" 
  ON public.storyline_user_monthly_usage 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Service role can manage all usage records (for admin purposes)
CREATE POLICY "Service role can manage all usage" 
  ON public.storyline_user_monthly_usage 
  FOR ALL 
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER handle_updated_at_storyline_monthly_usage
  BEFORE UPDATE ON public.storyline_user_monthly_usage
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RPC function to check user usage limits
CREATE OR REPLACE FUNCTION public.check_user_monthly_usage(
  user_id UUID,
  usage_type TEXT -- 'behavioral' or 'question_vault'
)
RETURNS JSON
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
    limit_count := 10;
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

-- RPC function to increment usage count
CREATE OR REPLACE FUNCTION public.increment_user_monthly_usage(
  user_id UUID,
  usage_type TEXT -- 'behavioral' or 'question_vault'
)
RETURNS JSON
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
  
  -- Check if user is premium (premium users don't need tracking)
  SELECT user_plan_status = 1 INTO is_premium
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
  
  -- Increment the appropriate counter
  IF usage_type = 'behavioral' THEN
    UPDATE public.storyline_user_monthly_usage
    SET behavioral_practices_count = behavioral_practices_count + 1,
        updated_at = now()
    WHERE storyline_user_monthly_usage.user_id = $1 
      AND month_year = current_month
    RETURNING behavioral_practices_count INTO usage_record.behavioral_practices_count;
  ELSIF usage_type = 'question_vault' THEN
    UPDATE public.storyline_user_monthly_usage
    SET question_vaults_count = question_vaults_count + 1,
        updated_at = now()
    WHERE storyline_user_monthly_usage.user_id = $1 
      AND month_year = current_month
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
    END
  );
END;
$$;

-- RPC function to get current month usage summary
CREATE OR REPLACE FUNCTION public.get_user_monthly_usage_summary(user_id UUID)
RETURNS JSON
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
        'limit', 10,
        'remaining', 10
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
      'limit', 10,
      'remaining', GREATEST(0, 10 - usage_record.behavioral_practices_count)
    ),
    'questionVault', json_build_object(
      'current', usage_record.question_vaults_count,
      'limit', 1,
      'remaining', GREATEST(0, 1 - usage_record.question_vaults_count)
    )
  );
END;
$$;
