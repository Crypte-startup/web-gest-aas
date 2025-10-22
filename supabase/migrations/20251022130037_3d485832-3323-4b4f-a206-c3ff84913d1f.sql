-- Ajouter les colonnes de gestion des congés à la table employees
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS leave_start_date date,
ADD COLUMN IF NOT EXISTS leave_end_date date,
ADD COLUMN IF NOT EXISTS leave_days integer DEFAULT 0;

COMMENT ON COLUMN public.employees.leave_start_date IS 'Date de début du congé';
COMMENT ON COLUMN public.employees.leave_end_date IS 'Date de fin du congé';
COMMENT ON COLUMN public.employees.leave_days IS 'Nombre de jours de congé accordés';