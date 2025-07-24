
-- Update the RLS policy to allow authenticated users to update any user info record
-- This is necessary for support agents to manage customer AI agent settings
DROP POLICY IF EXISTS "Users can update their own info" ON public.user_info;

CREATE POLICY "Authenticated users can update user info" 
  ON public.user_info 
  FOR UPDATE 
  TO authenticated
  USING (true);

-- Also ensure authenticated users can insert user info records if needed
CREATE POLICY "Authenticated users can insert user info" 
  ON public.user_info 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);
