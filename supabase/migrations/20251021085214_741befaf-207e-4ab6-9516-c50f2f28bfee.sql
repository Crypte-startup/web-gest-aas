-- Create devis_items table for line items in quotes
CREATE TABLE public.devis_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  devis_id UUID NOT NULL REFERENCES public.devis(id) ON DELETE CASCADE,
  designation TEXT NOT NULL,
  quantite NUMERIC NOT NULL DEFAULT 1,
  prix_unitaire NUMERIC NOT NULL,
  prix_total NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create facture_items table for line items in invoices
CREATE TABLE public.facture_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facture_id UUID NOT NULL REFERENCES public.facture(id) ON DELETE CASCADE,
  designation TEXT NOT NULL,
  quantite NUMERIC NOT NULL DEFAULT 1,
  prix_unitaire NUMERIC NOT NULL,
  prix_total NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.devis_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facture_items ENABLE ROW LEVEL SECURITY;

-- Create policies for devis_items
CREATE POLICY "Commercial users can manage devis items"
ON public.devis_items
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'resp_comm'::app_role)
);

CREATE POLICY "Commercial users can view devis items"
ON public.devis_items
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'resp_comm'::app_role)
);

-- Create policies for facture_items
CREATE POLICY "Commercial users can manage facture items"
ON public.facture_items
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'resp_comm'::app_role)
);

CREATE POLICY "Commercial users can view facture items"
ON public.facture_items
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'resp_comm'::app_role)
);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_devis_items_updated_at
BEFORE UPDATE ON public.devis_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_facture_items_updated_at
BEFORE UPDATE ON public.facture_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_devis_items_devis_id ON public.devis_items(devis_id);
CREATE INDEX idx_facture_items_facture_id ON public.facture_items(facture_id);