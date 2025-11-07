-- Migration pour corriger les incohérences dans les soldes d'ouverture

-- 1. Mettre à jour le statut des transactions d'ouverture existantes de APPROUVE à VALIDE
UPDATE ledger
SET status = 'VALIDE'
WHERE entry_id LIKE 'OPENING-%'
  AND entry_kind = 'RECETTE'
  AND status = 'APPROUVE';

-- 2. Créer les transactions DEPENSE manquantes pour le resp_compta
-- Pour chaque transaction OPENING-X-IN, créer un OPENING-X-OUT correspondant
INSERT INTO ledger (
  entry_id,
  entry_kind,
  currency,
  amount,
  account_owner,
  created_by,
  motif,
  status,
  created_at
)
SELECT 
  REPLACE(entry_id, '-IN', '-OUT') as entry_id,
  'DEPENSE' as entry_kind,
  currency,
  amount,
  created_by as account_owner,
  created_by,
  'Attribution solde ouverture (correction historique)' as motif,
  'VALIDE' as status,
  created_at
FROM ledger
WHERE entry_id LIKE 'OPENING-%-IN'
  AND entry_kind = 'RECETTE'
  AND NOT EXISTS (
    SELECT 1 FROM ledger l2 
    WHERE l2.entry_id = REPLACE(ledger.entry_id, '-IN', '-OUT')
  );