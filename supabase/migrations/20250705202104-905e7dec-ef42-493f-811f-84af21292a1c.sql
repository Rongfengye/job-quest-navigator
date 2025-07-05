
-- Phase 1: Rename table storyline_user_tokens to hireme_user_status and update all references

-- Step 1: Rename the table
ALTER TABLE public.storyline_user_tokens RENAME TO hireme_user_status;

-- Step 2: Update all database functions to reference the new table name

-- Update initialize_user_status function
CREATE OR REPLACE FUNCTION public.initialize_user_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.hireme_user_status (user_id, user_plan_status)
  VALUES (NEW.id, 0);
  RETURN NEW;
END;
$function$;

-- Update make_user_premium function
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
  
  UPDATE public.hireme_user_status
  SET user_plan_status = new_balance,
      updated_at = now()
  WHERE hireme_user_status.user_id = $1;
  
  RETURN new_balance;
END;
$function$;

-- Update make_user_basic function
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
  
  UPDATE public.hireme_user_status
  SET user_plan_status = new_balance,
      updated_at = now()
  WHERE hireme_user_status.user_id = $1;
  
  RETURN new_balance;
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
  FROM public.hireme_user_status
  WHERE hireme_user_status.user_id = $1;
  
  -- Toggle between 0 and 1
  IF current_status = 0 THEN
    new_status := 1;
  ELSE
    new_status := 0;
  END IF;
  
  -- Update the status
  UPDATE public.hireme_user_status
  SET user_plan_status = new_status,
      updated_at = now()
  WHERE hireme_user_status.user_id = $1;
  
  RETURN new_status;
END;
$function$;

-- Update backward compatibility functions to use new table name
CREATE OR REPLACE FUNCTION public.add_user_tokens(user_id uuid, amount integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN public.make_user_premium(user_id, amount);
END;
$function$;

CREATE OR REPLACE FUNCTION public.deduct_user_tokens(user_id uuid, amount integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN public.make_user_basic(user_id, amount);
END;
$function$;

-- Step 3: Update RLS policies (they automatically move with the table rename)
-- The policies will continue to work with the renamed table, but let's verify the names are clear

-- Note: RLS policies automatically transfer with table renames, so no additional changes needed
-- The existing policies will now apply to the hireme_user_status table
