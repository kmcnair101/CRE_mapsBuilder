/*
  # Fix Profile Creation Trigger

  1. Changes
    - Improve profile creation trigger to properly handle existing profiles
    - Add better error handling
    - Ensure idempotent operation

  2. Security
    - Maintain SECURITY DEFINER for proper permissions
*/

-- Drop existing function and recreate with better error handling
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Check if profile already exists
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = NEW.id
  ) THEN
    -- Create new profile only if it doesn't exist
    INSERT INTO public.profiles (
      id,
      email,
      subscription_tier,
      trial_ends_at
    ) VALUES (
      NEW.id,
      NEW.email,
      'free',
      (CURRENT_TIMESTAMP + INTERVAL '14 days')
    );
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, just return
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log other errors but don't fail
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();