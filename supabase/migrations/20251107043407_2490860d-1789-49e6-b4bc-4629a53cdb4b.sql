-- Create activity logs table
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  action_type TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action_type ON public.activity_logs(action_type);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view all logs"
ON public.activity_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert logs (via triggers)
CREATE POLICY "System can insert logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (true);

-- Function to log activity
CREATE OR REPLACE FUNCTION public.log_activity(
  p_action_type TEXT,
  p_table_name TEXT DEFAULT NULL,
  p_record_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email TEXT;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = auth.uid();

  INSERT INTO public.activity_logs (
    user_id,
    user_email,
    action_type,
    table_name,
    record_id,
    details
  ) VALUES (
    auth.uid(),
    v_user_email,
    p_action_type,
    p_table_name,
    p_record_id,
    p_details
  );
END;
$$;

-- Trigger function for ledger operations
CREATE OR REPLACE FUNCTION public.log_ledger_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(
      'CREATE_TRANSACTION',
      'ledger',
      NEW.id::TEXT,
      jsonb_build_object(
        'entry_id', NEW.entry_id,
        'entry_kind', NEW.entry_kind,
        'amount', NEW.amount,
        'currency', NEW.currency,
        'motif', NEW.motif
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_activity(
      'UPDATE_TRANSACTION',
      'ledger',
      NEW.id::TEXT,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'entry_id', NEW.entry_id
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_activity(
      'DELETE_TRANSACTION',
      'ledger',
      OLD.id::TEXT,
      jsonb_build_object(
        'entry_id', OLD.entry_id,
        'amount', OLD.amount,
        'currency', OLD.currency
      )
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for ledger
CREATE TRIGGER log_ledger_operations
AFTER INSERT OR UPDATE OR DELETE ON public.ledger
FOR EACH ROW EXECUTE FUNCTION log_ledger_changes();

-- Trigger function for clients operations
CREATE OR REPLACE FUNCTION public.log_client_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity('CREATE_CLIENT', 'clients', NEW.id::TEXT, 
      jsonb_build_object('name', NEW.name, 'phone', NEW.phone));
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_activity('UPDATE_CLIENT', 'clients', NEW.id::TEXT,
      jsonb_build_object('name', NEW.name));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_activity('DELETE_CLIENT', 'clients', OLD.id::TEXT,
      jsonb_build_object('name', OLD.name));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER log_client_operations
AFTER INSERT OR UPDATE OR DELETE ON public.clients
FOR EACH ROW EXECUTE FUNCTION log_client_changes();

-- Trigger for employees
CREATE OR REPLACE FUNCTION public.log_employee_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity('CREATE_EMPLOYEE', 'employees', NEW.id::TEXT,
      jsonb_build_object('full_name', NEW.full_name, 'position', NEW.position));
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_activity('UPDATE_EMPLOYEE', 'employees', NEW.id::TEXT,
      jsonb_build_object('full_name', NEW.full_name));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_activity('DELETE_EMPLOYEE', 'employees', OLD.id::TEXT,
      jsonb_build_object('full_name', OLD.full_name));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER log_employee_operations
AFTER INSERT OR UPDATE OR DELETE ON public.employees
FOR EACH ROW EXECUTE FUNCTION log_employee_changes();

-- Trigger for user roles changes
CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity('ASSIGN_ROLE', 'user_roles', NEW.id::TEXT,
      jsonb_build_object('user_id', NEW.user_id, 'role', NEW.role));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_activity('REVOKE_ROLE', 'user_roles', OLD.id::TEXT,
      jsonb_build_object('user_id', OLD.user_id, 'role', OLD.role));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER log_role_operations
AFTER INSERT OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION log_role_changes();