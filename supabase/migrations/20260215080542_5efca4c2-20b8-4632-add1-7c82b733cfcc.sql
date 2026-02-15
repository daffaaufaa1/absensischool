
-- Fix: super_admins needs RLS policy (currently no policy)
CREATE POLICY "No direct access to super_admins" ON public.super_admins FOR SELECT USING (false);
CREATE POLICY "No direct insert super_admins" ON public.super_admins FOR INSERT WITH CHECK (false);
CREATE POLICY "No direct update super_admins" ON public.super_admins FOR UPDATE USING (false);
CREATE POLICY "No direct delete super_admins" ON public.super_admins FOR DELETE USING (false);

-- Fix: schools ALL policy is too permissive, replace with proper scoping
DROP POLICY IF EXISTS "Super admins can manage schools" ON public.schools;
-- Only edge functions (service role) manage schools, no direct access for ALL
CREATE POLICY "Block direct insert schools" ON public.schools FOR INSERT WITH CHECK (false);
CREATE POLICY "Block direct update schools" ON public.schools FOR UPDATE USING (false);
CREATE POLICY "Block direct delete schools" ON public.schools FOR DELETE USING (false);
