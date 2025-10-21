-- Add motif column to devis table
ALTER TABLE public.devis 
ADD COLUMN motif TEXT;

-- Add motif column to facture table
ALTER TABLE public.facture 
ADD COLUMN motif TEXT;

-- Update RLS policies for devis to allow commercial users to access clients table
CREATE POLICY "Commercial users can view clients for devis/facture"
ON public.clients FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'resp_comm'::app_role)
);