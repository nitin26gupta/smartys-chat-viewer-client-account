-- Assign the missing role to the invited user
INSERT INTO public.user_roles (user_id, role)
VALUES ('5f023f2c-1362-4321-9337-2735f4cf2efb', 'user')
ON CONFLICT (user_id, role) DO NOTHING;