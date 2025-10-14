-- Allow admins to delete ledger entries
CREATE POLICY "Admins can delete transactions"
ON public.ledger
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));