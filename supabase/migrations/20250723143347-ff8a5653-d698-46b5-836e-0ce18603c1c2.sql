-- Enable RLS on existing tables that don't have it
ALTER TABLE public.session_user_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smartys_chat_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_info ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for session_user_mapping
CREATE POLICY "Users can manage their own session mappings"
ON public.session_user_mapping
FOR ALL
TO authenticated
USING (user_id = auth.uid()::text);

-- Create RLS policies for smartys_chat_histories
CREATE POLICY "Users can view chat histories for their sessions"
ON public.smartys_chat_histories
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.session_user_mapping
    WHERE session_user_mapping.session_id = smartys_chat_histories.session_id
    AND session_user_mapping.user_id = auth.uid()::text
  )
);

CREATE POLICY "Admins can view all chat histories"
ON public.smartys_chat_histories
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Create RLS policies for user_info
CREATE POLICY "Users can view their own info"
ON public.user_info
FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own info"
ON public.user_info
FOR UPDATE
TO authenticated
USING (user_id = auth.uid()::text);

CREATE POLICY "Admins can view all user info"
ON public.user_info
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all user info"
ON public.user_info
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- Fix search path for functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;