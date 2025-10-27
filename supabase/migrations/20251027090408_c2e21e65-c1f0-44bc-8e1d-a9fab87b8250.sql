-- Supprimer l'ancienne politique qui limite aux admins uniquement
DROP POLICY IF EXISTS "Admins can manage balances" ON public.starting_balances;

-- Créer une nouvelle politique permettant aux managers (admin + resp_compta) de gérer les soldes
CREATE POLICY "Managers can manage balances"
ON public.starting_balances
FOR ALL
TO authenticated
USING (is_admin_or_manager(auth.uid()))
WITH CHECK (is_admin_or_manager(auth.uid()));