-- Create commercial_clients table
CREATE TABLE public.commercial_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  postnom TEXT,
  prenom TEXT,
  sexe TEXT,
  date_naissance DATE,
  lieu_naissance TEXT,
  adresse TEXT,
  email TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create devis table
CREATE TABLE public.devis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.commercial_clients(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  devise TEXT NOT NULL CHECK (devise IN ('USD', 'CDF')),
  montant NUMERIC NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create facture table
CREATE TABLE public.facture (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.commercial_clients(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  devise TEXT NOT NULL CHECK (devise IN ('USD', 'CDF')),
  montant NUMERIC NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commercial_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facture ENABLE ROW LEVEL SECURITY;

-- RLS Policies for commercial_clients
CREATE POLICY "Commercial users can view clients"
ON public.commercial_clients
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'resp_comm'::app_role)
);

CREATE POLICY "Commercial users can manage clients"
ON public.commercial_clients
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'resp_comm'::app_role)
);

-- RLS Policies for devis
CREATE POLICY "Commercial users can view devis"
ON public.devis
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'resp_comm'::app_role)
);

CREATE POLICY "Commercial users can manage devis"
ON public.devis
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'resp_comm'::app_role)
);

-- RLS Policies for facture
CREATE POLICY "Commercial users can view factures"
ON public.facture
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'resp_comm'::app_role)
);

CREATE POLICY "Commercial users can manage factures"
ON public.facture
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'resp_comm'::app_role)
);

-- Triggers for updated_at
CREATE TRIGGER update_commercial_clients_updated_at
BEFORE UPDATE ON public.commercial_clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_devis_updated_at
BEFORE UPDATE ON public.devis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_facture_updated_at
BEFORE UPDATE ON public.facture
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();