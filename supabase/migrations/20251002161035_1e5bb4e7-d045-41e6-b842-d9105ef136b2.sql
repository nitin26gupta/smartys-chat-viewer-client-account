-- Drop and recreate the get_all_users function with better error handling
DROP FUNCTION IF EXISTS public.get_all_users();

CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE(id uuid, email text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if current user is admin
  -- Using the is_admin helper function which is also SECURITY DEFINER
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  -- Return all users from auth.users
  RETURN QUERY
  SELECT 
    u.id,
    u.email::text,
    u.created_at
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$$;