-- Ajouter une policy pour permettre aux managers de voir tous les rôles des utilisateurs
CREATE POLICY "Managers can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (is_admin_or_manager(auth.uid()));