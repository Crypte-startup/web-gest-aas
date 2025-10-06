-- Add new columns to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS postnom text,
ADD COLUMN IF NOT EXISTS prenom text,
ADD COLUMN IF NOT EXISTS date_naissance date,
ADD COLUMN IF NOT EXISTS domicile text,
ADD COLUMN IF NOT EXISTS ecole text,
ADD COLUMN IF NOT EXISTS adresse_ecole text,
ADD COLUMN IF NOT EXISTS classe text,
ADD COLUMN IF NOT EXISTS trajet text,
ADD COLUMN IF NOT EXISTS photo_url text;

-- Create storage bucket for client photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('client-photos', 'client-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authorized users can upload client photos" ON storage.objects;
DROP POLICY IF EXISTS "Client photos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authorized users can update client photos" ON storage.objects;
DROP POLICY IF EXISTS "Authorized users can delete client photos" ON storage.objects;

-- Create storage policies for client photos
CREATE POLICY "Authorized users can upload client photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client-photos' AND
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'resp_clientele'::app_role) OR 
   has_role(auth.uid(), 'prepose_clientele'::app_role))
);

CREATE POLICY "Client photos are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'client-photos');

CREATE POLICY "Authorized users can update client photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'client-photos' AND
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'resp_clientele'::app_role))
);

CREATE POLICY "Authorized users can delete client photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'client-photos' AND
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'resp_clientele'::app_role))
);