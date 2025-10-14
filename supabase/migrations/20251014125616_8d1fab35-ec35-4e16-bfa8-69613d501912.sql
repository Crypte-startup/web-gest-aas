-- Drop existing policies on clients table
DROP POLICY IF EXISTS "Authorized users can manage clients" ON public.clients;
DROP POLICY IF EXISTS "Authorized users can view clients" ON public.clients;

-- Create strengthened RLS policies with explicit authentication checks
-- Policy for SELECT: Require authentication AND specific roles
CREATE POLICY "Authenticated authorized users can view clients"
ON public.clients
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'resp_clientele'::app_role) 
    OR has_role(auth.uid(), 'prepose_clientele'::app_role)
  )
);

-- Policy for INSERT: Require authentication AND specific roles
CREATE POLICY "Authenticated authorized users can insert clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'resp_clientele'::app_role) 
    OR has_role(auth.uid(), 'prepose_clientele'::app_role)
  )
);

-- Policy for UPDATE: Require authentication AND specific roles
CREATE POLICY "Authenticated authorized users can update clients"
ON public.clients
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'resp_clientele'::app_role) 
    OR has_role(auth.uid(), 'prepose_clientele'::app_role)
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'resp_clientele'::app_role) 
    OR has_role(auth.uid(), 'prepose_clientele'::app_role)
  )
);

-- Policy for DELETE: Require authentication AND specific roles
CREATE POLICY "Authenticated authorized users can delete clients"
ON public.clients
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'resp_clientele'::app_role) 
    OR has_role(auth.uid(), 'prepose_clientele'::app_role)
  )
);

-- Ensure RLS is enabled (redundant but explicit for security)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner as well (prevents superuser bypass in application context)
ALTER TABLE public.clients FORCE ROW LEVEL SECURITY;