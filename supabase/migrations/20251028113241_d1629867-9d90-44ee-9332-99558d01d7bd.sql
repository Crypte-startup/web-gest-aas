-- Mise à jour du solde initial à 100 000 USD et 100 000 000 CDF
UPDATE ledger 
SET amount = 100000.00 
WHERE entry_id LIKE 'INITIAL-CAPITAL-USD%' AND currency = 'USD';

UPDATE ledger 
SET amount = 100000000.00 
WHERE entry_id LIKE 'INITIAL-CAPITAL-CDF%' AND currency = 'CDF';