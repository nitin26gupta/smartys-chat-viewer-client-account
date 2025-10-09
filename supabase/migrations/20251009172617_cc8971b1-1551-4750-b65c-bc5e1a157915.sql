-- Add admin role for martin@s-a-z.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('0e891e91-c7d9-4a07-b004-39a3f5d9fa44', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;