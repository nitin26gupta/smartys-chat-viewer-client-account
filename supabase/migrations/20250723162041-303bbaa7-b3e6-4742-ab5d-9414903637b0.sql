-- Fix RLS policies to allow admins to access user_info regardless of user_id matching
-- First, let's check if the user has admin role by checking the profiles/user_roles tables

-- Update the admin policy for user_info to be more permissive
DROP POLICY "Admins can view all user info" ON public.user_info;
DROP POLICY "Admins can manage all user info" ON public.user_info;

-- Create new admin policies that work with the actual auth system
CREATE POLICY "Admins can view all user info" 
ON public.user_info 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can manage all user info" 
ON public.user_info 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Also update the smartys_chat_histories admin policy
DROP POLICY "Admins can view all chat histories" ON public.smartys_chat_histories;

CREATE POLICY "Admins can view all chat histories" 
ON public.smartys_chat_histories 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Update session_user_mapping admin policy
DROP POLICY "Users can manage their own session mappings" ON public.session_user_mapping;

CREATE POLICY "Users can manage their own session mappings" 
ON public.session_user_mapping 
FOR ALL 
TO authenticated 
USING (user_id = auth.uid()::text);

CREATE POLICY "Admins can manage all session mappings" 
ON public.session_user_mapping 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);