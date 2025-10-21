-- Drop existing foreign key constraint if it exists
ALTER TABLE public.devis 
DROP CONSTRAINT IF EXISTS devis_client_id_fkey;

-- Add correct foreign key constraint pointing to clients table
ALTER TABLE public.devis 
ADD CONSTRAINT devis_client_id_fkey 
FOREIGN KEY (client_id) 
REFERENCES public.clients(id) 
ON DELETE SET NULL;

-- Do the same for facture table
ALTER TABLE public.facture 
DROP CONSTRAINT IF EXISTS facture_client_id_fkey;

ALTER TABLE public.facture 
ADD CONSTRAINT facture_client_id_fkey 
FOREIGN KEY (client_id) 
REFERENCES public.clients(id) 
ON DELETE SET NULL;