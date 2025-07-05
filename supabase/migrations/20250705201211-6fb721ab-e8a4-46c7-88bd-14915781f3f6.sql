
-- Phase 1: Database Schema Changes for Token System Cleanup

-- Step 1: Rename the column from tokens_remaining to user_plan_status
ALTER TABLE public.storyline_user_tokens 
RENAME COLUMN tokens_remaining TO user_plan_status;

-- Step 2: Migrate existing data - Convert all non-zero values to 1 and keep zeros as 0
UPDATE public.storyline_user_tokens 
SET user_plan_status = CASE 
  WHEN user_plan_status = 0 THEN 0 
  ELSE 1 
END;

-- Step 3: Update the default value to 0 for new users (basic plan)
ALTER TABLE public.storyline_user_tokens 
ALTER COLUMN user_plan_status SET DEFAULT 0;

-- Step 4: Update all database functions to reference the new column name

-- Update initialize_user_tokens function
CREATE OR REPLACE FUNCTION public.initialize_user_tokens()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.storyline_user_tokens (user_id, user_plan_status)
  VALUES (NEW.id, 0);
  RETURN NEW;
END;
$function$;

-- Update toggle_user_premium function
CREATE OR REPLACE FUNCTION public.toggle_user_premium(user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  current_status INTEGER;
  new_status INTEGER;
BEGIN
  -- Get current plan status
  SELECT user_plan_status INTO current_status
  FROM public.storyline_user_tokens
  WHERE storyline_user_tokens.user_id = $1;
  
  -- Toggle between 0 and 1
  IF current_status = 0 THEN
    new_status := 1;
  ELSE
    new_status := 0;
  END IF;
  
  -- Update the status
  UPDATE public.storyline_user_tokens
  SET user_plan_status = new_status,
      updated_at = now()
  WHERE storyline_user_tokens.user_id = $1;
  
  RETURN new_status;
END;
$function$;

-- Update add_user_tokens function (keeping for backward compatibility)
CREATE OR REPLACE FUNCTION public.add_user_tokens(user_id uuid, amount integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  new_balance INTEGER;
BEGIN
  -- For the binary system, any positive amount sets to 1 (premium)
  -- Zero or negative sets to 0 (basic)
  IF amount > 0 THEN
    new_balance := 1;
  ELSE
    new_balance := 0;
  END IF;
  
  UPDATE public.storyline_user_tokens
  SET user_plan_status = new_balance,
      updated_at = now()
  WHERE storyline_user_tokens.user_id = $1;
  
  RETURN new_balance;
END;
$function$;

-- Update deduct_user_tokens function
CREATE OR REPLACE FUNCTION public.deduct_user_tokens(user_id uuid, amount integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  new_balance INTEGER;
BEGIN
  -- In binary system, any deduction sets user to basic (0)
  new_balance := 0;
  
  UPDATE public.storyline_user_tokens
  SET user_plan_status = new_balance,
      updated_at = now()
  WHERE storyline_user_tokens.user_id = $1;
  
  RETURN new_balance;
END;
$function$;
