-- Update the INSERT policy on ledger table to include logistics roles
DROP POLICY IF EXISTS "Users can create transactions" ON public.ledger;

CREATE POLICY "Users can create transactions"
ON public.ledger
FOR INSERT
TO authenticated
WITH CHECK (
  (created_by = auth.uid()) AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'resp_compta'::app_role) OR 
    has_role(auth.uid(), 'caissier'::app_role) OR 
    has_role(auth.uid(), 'caissier1'::app_role) OR 
    has_role(auth.uid(), 'caissier2'::app_role) OR 
    has_role(auth.uid(), 'caissier3'::app_role) OR 
    has_role(auth.uid(), 'caissier4'::app_role) OR 
    has_role(auth.uid(), 'caissier5'::app_role) OR
    has_role(auth.uid(), 'resp_log'::app_role) OR
    has_role(auth.uid(), 'prepose_log'::app_role)
  )
);