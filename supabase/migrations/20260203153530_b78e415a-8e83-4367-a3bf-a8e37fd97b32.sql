-- Fix PUBLIC_DATA_EXPOSURE: user_roles table
-- Drop the overly permissive policy that allows anyone to view roles
DROP POLICY IF EXISTS "Anyone can view roles" ON public.user_roles;

-- Create a new policy that only allows authenticated users to view roles
CREATE POLICY "Authenticated users can view roles" ON public.user_roles
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Fix PUBLIC_DATA_EXPOSURE: profiles table
-- Drop the overly permissive policy that allows anyone to view profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a new policy that only allows authenticated users to view profiles
CREATE POLICY "Authenticated users can view profiles" ON public.profiles
FOR SELECT USING (auth.uid() IS NOT NULL);