-- Fix the missing role assignment and mark invitation as used for barkha.mittal@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('142685a3-90c3-4a4a-a49b-c6405048ea4f', 'user')
ON CONFLICT (user_id, role) DO NOTHING;

-- Mark their invitation as used
UPDATE public.user_invitations 
SET used_at = now() 
WHERE email = 'barkha.mittal@gmail.com' AND used_at IS NULL;