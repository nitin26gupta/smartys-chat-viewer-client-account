-- Add INSERT policy for smartys_chat_histories table to allow admins to send replies
CREATE POLICY "Admins can insert chat messages" 
ON public.smartys_chat_histories 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);