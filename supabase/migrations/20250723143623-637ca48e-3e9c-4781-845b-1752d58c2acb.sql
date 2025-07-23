-- Create RPC function to get all users (admin only)
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if user is admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.created_at
  FROM auth.users u;
END;
$$;

-- Create RPC function to delete a user (admin only) 
CREATE OR REPLACE FUNCTION public.delete_user(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if user is admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  -- Prevent self-deletion
  IF user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account.';
  END IF;
  
  -- Delete user (cascades will handle related records)
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;