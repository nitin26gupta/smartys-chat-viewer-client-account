-- Fix the handle_new_user trigger to work without profiles table
-- and properly mark invitations as used

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Check if there's a valid invitation for this email
  SELECT * INTO invitation_record
  FROM public.user_invitations
  WHERE email = NEW.email
    AND used_at IS NULL
    AND expires_at > now();

  -- If no valid invitation found, prevent signup (except for first admin)
  IF invitation_record IS NULL THEN
    -- Check if this is the first user (making them admin)
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id != NEW.id) THEN
      -- First user becomes admin
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'admin');
      
      RETURN NEW;
    ELSE
      -- No invitation found for non-first user
      RAISE EXCEPTION 'Registration requires a valid invitation';
    END IF;
  ELSE
    -- Valid invitation found, mark as used
    UPDATE public.user_invitations
    SET used_at = now()
    WHERE id = invitation_record.id;
  END IF;

  -- Assign default role for invited users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;

-- Also manually mark the existing user's invitation as used
UPDATE public.user_invitations 
SET used_at = now() 
WHERE email = 'nitin162.gupta@gmail.com' AND used_at IS NULL;