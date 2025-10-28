-- Ajouter un solde initial au resp_compta pour démarrer les opérations
-- Cette transaction simule un apport en capital de départ

-- Insérer un solde initial de 10,000 USD pour le resp_compta (s'il n'existe pas déjà)
DO $$
BEGIN
  -- Vérifier si le capital initial USD existe déjà
  IF NOT EXISTS (SELECT 1 FROM public.ledger WHERE entry_id = 'INITIAL-CAPITAL-USD') THEN
    INSERT INTO public.ledger (
      entry_id,
      entry_kind,
      currency,
      amount,
      account_owner,
      created_by,
      motif,
      status
    )
    SELECT
      'INITIAL-CAPITAL-USD',
      'RECETTE',
      'USD',
      10000.00,
      ur.user_id,
      ur.user_id,
      'Capital initial - Fond de roulement',
      'VALIDE'
    FROM public.user_roles ur
    WHERE ur.role = 'resp_compta'
    LIMIT 1;
  END IF;
END $$;

-- Insérer un solde initial de 10,000,000 CDF pour le resp_compta (s'il n'existe pas déjà)
DO $$
BEGIN
  -- Vérifier si le capital initial CDF existe déjà
  IF NOT EXISTS (SELECT 1 FROM public.ledger WHERE entry_id = 'INITIAL-CAPITAL-CDF') THEN
    INSERT INTO public.ledger (
      entry_id,
      entry_kind,
      currency,
      amount,
      account_owner,
      created_by,
      motif,
      status
    )
    SELECT
      'INITIAL-CAPITAL-CDF',
      'RECETTE',
      'CDF',
      10000000.00,
      ur.user_id,
      ur.user_id,
      'Capital initial - Fond de roulement',
      'VALIDE'
    FROM public.user_roles ur
    WHERE ur.role = 'resp_compta'
    LIMIT 1;
  END IF;
END $$;