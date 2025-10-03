import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 
  | 'admin'
  | 'resp_compta'
  | 'caissier'
  | 'prepose_clientele'
  | 'resp_clientele'
  | 'prepose_log'
  | 'resp_log'
  | 'prepose_rh'
  | 'resp_rh'
  | 'prepose_comm'
  | 'resp_comm';

export const useUserRole = (userId: string | undefined) => {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchRoles = async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (!error && data) {
        setRoles(data.map(r => r.role as AppRole));
      }
      setLoading(false);
    };

    fetchRoles();

    // Subscribe to role changes
    const channel = supabase
      .channel('user_roles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchRoles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const hasRole = (role: AppRole) => roles.includes(role);
  const isAdmin = hasRole('admin');
  const isManager = roles.some(r => 
    ['admin', 'resp_compta', 'resp_log', 'resp_clientele', 'resp_rh', 'resp_comm'].includes(r)
  );

  return {
    roles,
    loading,
    hasRole,
    isAdmin,
    isManager,
  };
};
