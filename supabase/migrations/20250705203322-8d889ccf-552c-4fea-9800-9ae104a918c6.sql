
-- Create trigger on auth.users table to automatically initialize user status
-- This will run whenever a new user is inserted into auth.users (i.e., when they sign up)
CREATE TRIGGER on_auth_user_created_initialize_status
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_status();
