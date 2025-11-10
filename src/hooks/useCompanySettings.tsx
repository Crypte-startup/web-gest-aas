import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CompanySettings {
  id: string;
  company_name: string;
  rccm: string;
  id_nat: string;
  nif: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  province: string;
  country: string;
  logo_url: string | null;
}

export const useCompanySettings = () => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSettings();

    // Subscribe to changes in company_settings
    const channel = supabase
      .channel('company_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'company_settings',
        },
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error('Error fetching company settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { settings, isLoading };
};
