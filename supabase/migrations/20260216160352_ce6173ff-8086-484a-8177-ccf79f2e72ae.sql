
-- Drop the recursive policy
DROP POLICY IF EXISTS "Users can view profiles in own school" ON public.profiles;

-- Create fixed policy using security definer function to avoid recursion
CREATE POLICY "Users can view profiles in own school"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    user_id = auth.uid()
    OR school_id = public.get_user_school_id(auth.uid())
  )
);
