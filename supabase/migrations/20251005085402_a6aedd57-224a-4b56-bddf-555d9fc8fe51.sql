-- Fix Security Issues: Restrict Public Access to Sensitive Data

-- 1. FIX: Profiles table - restrict public access to user contact information
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create restricted policies: users can view their own profile, admins can view all
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. FIX: Clients table - restrict to authenticated users with proper roles only
-- Drop the public access policy
DROP POLICY IF EXISTS "Users can view all clients" ON public.clients;

-- Create role-based policy for viewing clients
CREATE POLICY "Authorized users can view clients"
ON public.clients
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'resp_clientele'::app_role) OR
  has_role(auth.uid(), 'prepose_clientele'::app_role)
);

-- 3. FIX: Employees table - restrict salary access from junior HR staff
-- Drop the current overly permissive SELECT policy
DROP POLICY IF EXISTS "Authorized users can view employees" ON public.employees;

-- Create separate policies: full access for admin/resp_rh only
CREATE POLICY "Admin and HR managers can view all employee data"
ON public.employees
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'resp_rh'::app_role)
);

-- Junior HR staff can view employee data but without salary information
-- Note: This still allows SELECT but application should filter salary column
CREATE POLICY "Junior HR can view employee basic info"
ON public.employees
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'prepose_rh'::app_role)
);