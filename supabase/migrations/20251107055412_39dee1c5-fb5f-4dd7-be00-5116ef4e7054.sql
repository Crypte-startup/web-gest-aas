-- Ajout des foreign keys pour assurer l'intégrité référentielle

-- 1. Foreign key de ledger.account_owner vers profiles.id
ALTER TABLE public.ledger
ADD CONSTRAINT fk_ledger_account_owner
FOREIGN KEY (account_owner) REFERENCES public.profiles(id)
ON DELETE SET NULL;

-- 2. Foreign key de ledger.created_by vers profiles.id  
ALTER TABLE public.ledger
ADD CONSTRAINT fk_ledger_created_by
FOREIGN KEY (created_by) REFERENCES public.profiles(id)
ON DELETE SET NULL;

-- 3. Foreign key de closing_transfers.cashier_id vers profiles.id
ALTER TABLE public.closing_transfers
ADD CONSTRAINT fk_closing_transfers_cashier_id
FOREIGN KEY (cashier_id) REFERENCES public.profiles(id)
ON DELETE RESTRICT;

-- 4. Foreign key de closing_transfers.created_by vers profiles.id
ALTER TABLE public.closing_transfers
ADD CONSTRAINT fk_closing_transfers_created_by
FOREIGN KEY (created_by) REFERENCES public.profiles(id)
ON DELETE SET NULL;

-- 5. Foreign key de user_roles.user_id vers profiles.id
ALTER TABLE public.user_roles
ADD CONSTRAINT fk_user_roles_user_id
FOREIGN KEY (user_id) REFERENCES public.profiles(id)
ON DELETE CASCADE;