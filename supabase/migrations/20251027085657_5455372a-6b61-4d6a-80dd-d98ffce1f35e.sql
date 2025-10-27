-- Permettre aux managers de voir tous les profils
CREATE POLICY "Managers can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_admin_or_manager(auth.uid()));