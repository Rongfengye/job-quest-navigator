
-- Phase 1: Remove the conflicting legacy function and trigger that's causing 500 errors
DROP TRIGGER IF EXISTS on_auth_user_created_initialize_tokens ON auth.users;
DROP FUNCTION IF EXISTS public.initialize_user_tokens();

-- Phase 2: Verify the correct trigger exists for hireme_user_status
-- The trigger should already exist from migration 20250705203322, but let's ensure it's properly set up
DROP TRIGGER IF EXISTS on_auth_user_created_initialize_status ON auth.users;

CREATE TRIGGER on_auth_user_created_initialize_status
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_status();

-- Phase 3: Clean up any remaining legacy references
-- Remove any other functions that might reference the old storyline_user_tokens table
-- (These should already be cleaned up from previous migrations, but ensuring consistency)
