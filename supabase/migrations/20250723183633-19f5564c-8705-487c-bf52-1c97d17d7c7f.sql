-- Update RLS policy to allow all authenticated users to view all user info
-- This is needed for the conversation system to work

DROP POLICY IF EXISTS "Users can view their own info" ON public.user_info;
DROP POLICY IF EXISTS "Users can update their own info" ON public.user_info;

-- Allow all authenticated users to view all user info (needed for conversation loading)
CREATE POLICY "Authenticated users can view all user info" 
ON public.user_info 
FOR SELECT 
TO authenticated
USING (true);

-- Keep the update policy restricted to own records
CREATE POLICY "Users can update their own info" 
ON public.user_info 
FOR UPDATE 
TO authenticated
USING ((user_id)::text = (auth.uid())::text);