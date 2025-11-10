-- Create company_settings table
CREATE TABLE IF NOT EXISTS public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL DEFAULT 'AMARA CHAM SARL',
  rccm TEXT NOT NULL DEFAULT 'CD/LSI/RCCM/24-B-745',
  id_nat TEXT NOT NULL DEFAULT '05-H4901-N70222J',
  nif TEXT NOT NULL DEFAULT 'A2434893E',
  phone TEXT NOT NULL DEFAULT '+243 82 569 21 21',
  email TEXT NOT NULL DEFAULT 'info@amarachamsarl.com',
  address TEXT NOT NULL DEFAULT '1144 avenue maître mawanga',
  city TEXT NOT NULL DEFAULT 'Quartier Ile du golf, Commune de Likasi',
  province TEXT NOT NULL DEFAULT 'Haut Katanga',
  country TEXT NOT NULL DEFAULT 'République Démocratique du Congo',
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read company settings
CREATE POLICY "Anyone can view company settings"
  ON public.company_settings
  FOR SELECT
  USING (true);

-- Only admins can modify company settings
CREATE POLICY "Only admins can modify company settings"
  ON public.company_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default company settings
INSERT INTO public.company_settings (company_name) 
VALUES ('AMARA CHAM SARL')
ON CONFLICT DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();