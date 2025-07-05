
-- Update the initialize_user_tokens function to start users with 0 tokens (basic/free)
CREATE OR REPLACE FUNCTION public.initialize_user_tokens()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.storyline_user_tokens (user_id, tokens_remaining)
  VALUES (NEW.id, 0);
  RETURN NEW;
END;
$function$;

-- Rename and update add_user_tokens to toggle_user_premium
-- This function will toggle between 0 (basic) and 1 (premium)
CREATE OR REPLACE FUNCTION public.toggle_user_premium(user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  current_status INTEGER;
  new_status INTEGER;
BEGIN
  -- Get current token status
  SELECT tokens_remaining INTO current_status
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
  SET tokens_remaining = new_status,
      updated_at = now()
  WHERE storyline_user_tokens.user_id = $1;
  
  RETURN new_status;
END;
$function$;

-- Keep the original add_user_tokens function for backward compatibility
-- but modify it to work with binary logic (0 or 1 only)
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
  SET tokens_remaining = new_balance,
      updated_at = now()
  WHERE storyline_user_tokens.user_id = $1;
  
  RETURN new_balance;
END;
$function$;

-- Update deduct_user_tokens to work with binary logic
-- This will set user to basic (0) regardless of amount
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
  SET tokens_remaining = new_balance,
      updated_at = now()
  WHERE storyline_user_tokens.user_id = $1;
  
  RETURN new_balance;
END;
$function$;
