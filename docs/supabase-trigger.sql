-- ============================================================================
-- SUPABASE TRIGGER: Auto-create Profile on User Signup
-- ============================================================================
-- This trigger automatically creates a profile in the public.profiles table
-- whenever a new user signs up via Supabase Auth.
--
-- Run this in Supabase SQL Editor:
-- https://app.supabase.com/project/cunyrukxlqqilrjburow/editor

-- Step 1: Create the function that inserts into profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    username,
    display_name,
    email,
    is_published,
    vacation_mode,
    auto_approve_orders
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    true,
    false,
    false
  );
  RETURN NEW;
END;
$$;

-- Step 2: Create the trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. The trigger uses metadata passed during signup:
--    - username: from raw_user_meta_data->>'username'
--    - display_name: from raw_user_meta_data->>'display_name'
--
-- 2. If metadata is missing, falls back to email prefix (before @)
--
-- 3. Default values:
--    - is_published: true
--    - vacation_mode: false
--    - auto_approve_orders: false
--
-- 4. The trigger uses SECURITY DEFINER to run with elevated privileges
--
-- 5. Make sure the profiles table exists with the correct schema before
--    running this trigger!
--
-- ============================================================================
-- TESTING:
-- ============================================================================
-- After creating this trigger, test it by signing up a new user through
-- the app at http://localhost:3000/login
--
-- The profile should be automatically created with:
-- - user_id: linked to auth.users
-- - username: from the signup form
-- - display_name: from the signup form
-- - email: from the signup form
-- ============================================================================
