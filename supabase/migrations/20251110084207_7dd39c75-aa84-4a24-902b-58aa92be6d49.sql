-- Créer une table pour sauvegarder les données avant réinitialisation
CREATE TABLE public.data_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  ledger_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  closing_transfers_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  starting_balances_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.data_backups ENABLE ROW LEVEL SECURITY;

-- Seuls les admins peuvent voir et gérer les backups
CREATE POLICY "Admins can view all backups"
  ON public.data_backups
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create backups"
  ON public.data_backups
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete backups"
  ON public.data_backups
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));