
-- Phase 1 Cleanup: Rename database functions to more specific names

-- Rename initialize_user_tokens to initialize_user_status
CREATE OR REPLACE FUNCTION public.initialize_user_status()
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

-- Drop the old function
DROP FUNCTION IF EXISTS public.initialize_user_tokens();

-- Rename add_user_tokens to make_user_premium
CREATE OR REPLACE FUNCTION public.make_user_premium(user_id uuid, amount integer DEFAULT 1)
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

-- Keep add_user_tokens for backward compatibility (calls make_user_premium)
CREATE OR REPLACE FUNCTION public.add_user_tokens(user_id uuid, amount integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN public.make_user_premium(user_id, amount);
END;
$function$;

-- Rename deduct_user_tokens to make_user_basic
CREATE OR REPLACE FUNCTION public.make_user_basic(user_id uuid, amount integer DEFAULT 1)
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

-- Keep deduct_user_tokens for backward compatibility (calls make_user_basic)
CREATE OR REPLACE FUNCTION public.deduct_user_tokens(user_id uuid, amount integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN public.make_user_basic(user_id, amount);
END;
$function$;
