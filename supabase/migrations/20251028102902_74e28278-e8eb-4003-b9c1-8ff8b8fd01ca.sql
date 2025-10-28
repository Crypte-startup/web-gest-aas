-- 1. Créer la table closing_transfers pour stocker les clôtures journalières
CREATE TABLE IF NOT EXISTS public.closing_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cashier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cashier_role TEXT NOT NULL,
  closing_date DATE NOT NULL DEFAULT CURRENT_DATE,
  opening_balance_usd NUMERIC DEFAULT 0,
  opening_balance_cdf NUMERIC DEFAULT 0,
  closing_balance_usd NUMERIC NOT NULL,
  closing_balance_cdf NUMERIC NOT NULL,
  transferred_usd NUMERIC NOT NULL,
  transferred_cdf NUMERIC NOT NULL,
  expected_balance_usd NUMERIC NOT NULL,
  expected_balance_cdf NUMERIC NOT NULL,
  gap_usd NUMERIC DEFAULT 0,
  gap_cdf NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(cashier_id, closing_date)
);

-- 2. Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_closing_transfers_cashier ON public.closing_transfers(cashier_id);
CREATE INDEX IF NOT EXISTS idx_closing_transfers_date ON public.closing_transfers(closing_date);

-- 3. Activer RLS
ALTER TABLE public.closing_transfers ENABLE ROW LEVEL SECURITY;

-- 4. Politiques RLS pour closing_transfers
CREATE POLICY "Cashiers can view own closures"
ON public.closing_transfers FOR SELECT
USING (auth.uid() = cashier_id);

CREATE POLICY "Cashiers can create own closures"
ON public.closing_transfers FOR INSERT
WITH CHECK (auth.uid() = cashier_id);

CREATE POLICY "Managers can view all closures"
ON public.closing_transfers FOR SELECT
USING (is_admin_or_manager(auth.uid()));

CREATE POLICY "Admins can manage all closures"
ON public.closing_transfers FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Trigger pour empêcher les modifications des clôtures (audit trail immuable)
CREATE OR REPLACE FUNCTION public.prevent_closure_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Les clôtures ne peuvent pas être modifiées ou supprimées après création';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_closures
BEFORE UPDATE OR DELETE ON public.closing_transfers
FOR EACH ROW EXECUTE FUNCTION public.prevent_closure_modification();

-- 6. CRITIQUE : Modifier les politiques RLS de ledger pour bloquer l'accès temps réel au resp_compta
-- Supprimer l'ancienne politique qui permet aux managers de voir toutes les transactions en temps réel
DROP POLICY IF EXISTS "Users can view relevant transactions" ON public.ledger;

-- Nouvelle politique : les utilisateurs ne peuvent voir que leurs propres transactions
-- Les managers (resp_compta) ne peuvent PLUS voir les transactions en temps réel des caissiers
CREATE POLICY "Users can view own transactions"
ON public.ledger FOR SELECT
USING (
  (created_by = auth.uid() OR account_owner = auth.uid())
);

-- Politique séparée pour les admins (peuvent voir toutes les transactions pour debug/audit)
CREATE POLICY "Admins can view all transactions"
ON public.ledger FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));