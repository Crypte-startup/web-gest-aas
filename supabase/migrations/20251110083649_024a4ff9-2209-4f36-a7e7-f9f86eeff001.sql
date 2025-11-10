-- Remplacer temporairement la fonction pour permettre les suppressions
CREATE OR REPLACE FUNCTION public.prevent_closure_modification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Temporairement désactivé pour permettre la réinitialisation
  RETURN NEW;
END;
$function$;

-- Réinitialiser toutes les données
DELETE FROM closing_transfers;
DELETE FROM ledger;
DELETE FROM starting_balances;

-- Restaurer la fonction de protection originale
CREATE OR REPLACE FUNCTION public.prevent_closure_modification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Les clôtures ne peuvent pas être modifiées ou supprimées après création';
  END IF;
  RETURN NEW;
END;
$function$;