-- Create table for monthly report archive
CREATE TABLE public.monthly_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_month INTEGER NOT NULL,
  report_year INTEGER NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  kpis JSONB NOT NULL,
  comparison_data JSONB,
  cashier_summary JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(report_month, report_year)
);

-- Enable RLS
ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;

-- Policy for admins and managers to view all reports
CREATE POLICY "Admins and managers can view all reports"
ON public.monthly_reports
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'resp_compta'::app_role)
);

-- Policy for admins and managers to create reports
CREATE POLICY "Admins and managers can create reports"
ON public.monthly_reports
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'resp_compta'::app_role)
);

-- Policy for admins to update reports
CREATE POLICY "Admins can update reports"
ON public.monthly_reports
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policy for admins to delete reports
CREATE POLICY "Admins can delete reports"
ON public.monthly_reports
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_monthly_reports_date ON public.monthly_reports(report_year DESC, report_month DESC);
CREATE INDEX idx_monthly_reports_generated_by ON public.monthly_reports(generated_by);