-- Add new columns to employees table for detailed information
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS nom TEXT,
ADD COLUMN IF NOT EXISTS postnom TEXT,
ADD COLUMN IF NOT EXISTS prenom TEXT,
ADD COLUMN IF NOT EXISTS date_naissance DATE,
ADD COLUMN IF NOT EXISTS adresse TEXT;

-- Update full_name to be nullable since we'll use nom, postnom, prenom instead
ALTER TABLE public.employees 
ALTER COLUMN full_name DROP NOT NULL;