-- Attribuer le capital initial à TOUS les resp_compta qui n'en ont pas encore
DO $$
DECLARE
  resp_compta_user RECORD;
BEGIN
  -- Parcourir tous les utilisateurs avec le rôle resp_compta
  FOR resp_compta_user IN 
    SELECT DISTINCT user_id 
    FROM public.user_roles 
    WHERE role = 'resp_compta'
  LOOP
    -- Capital initial USD
    IF NOT EXISTS (
      SELECT 1 FROM public.ledger 
      WHERE entry_id = 'INITIAL-CAPITAL-USD-' || resp_compta_user.user_id::text
    ) THEN
      INSERT INTO public.ledger (
        entry_id,
        entry_kind,
        currency,
        amount,
        account_owner,
        created_by,
        motif,
        status
      ) VALUES (
        'INITIAL-CAPITAL-USD-' || resp_compta_user.user_id::text,
        'RECETTE',
        'USD',
        10000.00,
        resp_compta_user.user_id,
        resp_compta_user.user_id,
        'Capital initial - Fond de roulement',
        'VALIDE'
      );
    END IF;

    -- Capital initial CDF
    IF NOT EXISTS (
      SELECT 1 FROM public.ledger 
      WHERE entry_id = 'INITIAL-CAPITAL-CDF-' || resp_compta_user.user_id::text
    ) THEN
      INSERT INTO public.ledger (
        entry_id,
        entry_kind,
        currency,
        amount,
        account_owner,
        created_by,
        motif,
        status
      ) VALUES (
        'INITIAL-CAPITAL-CDF-' || resp_compta_user.user_id::text,
        'RECETTE',
        'CDF',
        10000000.00,
        resp_compta_user.user_id,
        resp_compta_user.user_id,
        'Capital initial - Fond de roulement',
        'VALIDE'
      );
    END IF;
  END LOOP;
END $$;