-- Mettre à jour la politique RLS pour que chaque caissier ne voie que ses propres transactions
DROP POLICY IF EXISTS "Users can view relevant transactions" ON ledger;

CREATE POLICY "Users can view relevant transactions"
ON ledger
FOR SELECT
USING (
  -- Admin et comptable peuvent tout voir
  is_admin_or_manager(auth.uid())
  OR
  -- Caissiers voient uniquement leurs propres transactions
  (created_by = auth.uid() AND (
    has_role(auth.uid(), 'caissier1'::app_role)
    OR has_role(auth.uid(), 'caissier2'::app_role)
    OR has_role(auth.uid(), 'caissier3'::app_role)
    OR has_role(auth.uid(), 'caissier4'::app_role)
    OR has_role(auth.uid(), 'caissier5'::app_role)
  ))
  OR
  -- Ou transactions où l'utilisateur est le propriétaire du compte
  (account_owner = auth.uid())
);

-- Mettre à jour la politique d'insertion pour inclure les caissiers
DROP POLICY IF EXISTS "Users can create transactions" ON ledger;

CREATE POLICY "Users can create transactions"
ON ledger
FOR INSERT
WITH CHECK (
  created_by = auth.uid() AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'resp_compta'::app_role)
    OR has_role(auth.uid(), 'caissier'::app_role)
    OR has_role(auth.uid(), 'caissier1'::app_role)
    OR has_role(auth.uid(), 'caissier2'::app_role)
    OR has_role(auth.uid(), 'caissier3'::app_role)
    OR has_role(auth.uid(), 'caissier4'::app_role)
    OR has_role(auth.uid(), 'caissier5'::app_role)
  )
);