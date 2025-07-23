-- Update RLS policies to allow all authenticated users to view conversations

-- Drop the existing restrictive policy for users viewing chat histories
DROP POLICY IF EXISTS "Users can view chat histories for their sessions" ON public.smartys_chat_histories;

-- Create a new policy that allows all authenticated users to view chat histories
CREATE POLICY "Authenticated users can view all chat histories" 
ON public.smartys_chat_histories 
FOR SELECT 
TO authenticated
USING (true);

-- Also update the session_user_mapping policies to allow all authenticated users to view all mappings
DROP POLICY IF EXISTS "Users can manage their own session mappings" ON public.session_user_mapping;

-- Allow all authenticated users to view session mappings (needed for the chat functionality)
CREATE POLICY "Authenticated users can view all session mappings" 
ON public.session_user_mapping 
FOR SELECT 
TO authenticated
USING (true);

-- Keep insert/update/delete restricted to admins for session mappings
CREATE POLICY "Admins can insert session mappings" 
ON public.session_user_mapping 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

CREATE POLICY "Admins can update session mappings" 
ON public.session_user_mapping 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

CREATE POLICY "Admins can delete session mappings" 
ON public.session_user_mapping 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);