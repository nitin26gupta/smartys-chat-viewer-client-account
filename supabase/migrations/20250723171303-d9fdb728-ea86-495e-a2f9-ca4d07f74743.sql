-- Grant necessary permissions for real-time subscriptions
-- The real-time subscription needs to be able to access the table data

-- Ensure the realtime user can access the table for real-time updates
GRANT SELECT ON public.smartys_chat_histories TO supabase_realtime_admin;
GRANT SELECT ON public.session_user_mapping TO supabase_realtime_admin;
GRANT SELECT ON public.user_roles TO supabase_realtime_admin;

-- Make sure replica identity is properly set
ALTER TABLE public.smartys_chat_histories REPLICA IDENTITY FULL;

-- Ensure the table is in the realtime publication (should already be there but let's make sure)
-- Drop and re-add to reset any potential issues
ALTER PUBLICATION supabase_realtime DROP TABLE public.smartys_chat_histories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.smartys_chat_histories;