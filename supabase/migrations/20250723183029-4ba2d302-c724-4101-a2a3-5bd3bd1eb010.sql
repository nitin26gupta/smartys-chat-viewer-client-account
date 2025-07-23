-- Create the trigger to handle new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also delete the unauthorized user that shouldn't exist
DELETE FROM auth.users WHERE email = 'abc@gmail.com';