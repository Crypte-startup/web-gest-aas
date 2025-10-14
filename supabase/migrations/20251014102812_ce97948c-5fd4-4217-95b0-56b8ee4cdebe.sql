-- Ajouter les 5 rôles de caissier à l'enum app_role
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'caissier1';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'caissier2';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'caissier3';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'caissier4';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'caissier5';