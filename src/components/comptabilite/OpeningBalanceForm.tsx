import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const openingBalanceSchema = z.object({
  cashier_id: z.string().min(1, 'Sélectionnez un caissier'),
  usd_amount: z.string().min(1, 'Montant USD requis'),
  cdf_amount: z.string().min(1, 'Montant CDF requis'),
});

type OpeningBalanceFormData = z.infer<typeof openingBalanceSchema>;

interface Cashier {
  userId: string;
  role: string;
  email: string;
}

const OpeningBalanceForm = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [cashiers, setCashiers] = useState<Cashier[]>([]);

  const form = useForm<OpeningBalanceFormData>({
    resolver: zodResolver(openingBalanceSchema),
    defaultValues: {
      cashier_id: '',
      usd_amount: '0',
      cdf_amount: '0',
    },
  });

  useEffect(() => {
    fetchCashiers();
  }, []);

  const fetchCashiers = async () => {
    try {
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['caissier', 'caissier1', 'caissier2', 'caissier3', 'caissier4', 'caissier5']);

      if (rolesError) throw rolesError;

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userRoles?.map(ur => ur.user_id) || []);

      if (profilesError) throw profilesError;

      const cashierList = userRoles?.map(ur => {
        const profile = profiles?.find(p => p.id === ur.user_id);
        return {
          userId: ur.user_id,
          role: ur.role,
          email: profile?.email || 'Email inconnu',
        };
      }) || [];

      setCashiers(cashierList);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message,
      });
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      caissier: 'Caissier',
      caissier1: 'Caissier 1',
      caissier2: 'Caissier 2',
      caissier3: 'Caissier 3',
      caissier4: 'Caissier 4',
      caissier5: 'Caissier 5',
    };
    return labels[role] || role;
  };

  const onSubmit = async (data: OpeningBalanceFormData) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Récupérer le rôle du caissier sélectionné
      const selectedCashier = cashiers.find(c => c.userId === data.cashier_id);
      if (!selectedCashier) throw new Error('Caissier non trouvé');

      // Créer ou mettre à jour les soldes d'ouverture
      const usdBalance = {
        user_id: data.cashier_id,
        currency: 'USD' as const,
        amount: parseFloat(data.usd_amount),
        account: selectedCashier.role,
      };

      const cdfBalance = {
        user_id: data.cashier_id,
        currency: 'CDF' as const,
        amount: parseFloat(data.cdf_amount),
        account: selectedCashier.role,
      };

      // Vérifier si un solde existe déjà
      const { data: existingBalances } = await supabase
        .from('starting_balances')
        .select('*')
        .eq('user_id', data.cashier_id);

      if (existingBalances && existingBalances.length > 0) {
        // Mettre à jour les soldes existants
        for (const balance of [usdBalance, cdfBalance]) {
          const existing = existingBalances.find(
            eb => eb.currency === balance.currency && eb.account === balance.account
          );

          if (existing) {
            await supabase
              .from('starting_balances')
              .update({ amount: balance.amount })
              .eq('id', existing.id);
          } else {
            await supabase
              .from('starting_balances')
              .insert([balance]);
          }
        }
      } else {
        // Créer de nouveaux soldes
        await supabase
          .from('starting_balances')
          .insert([usdBalance, cdfBalance]);
      }

      toast({
        title: 'Succès',
        description: 'Solde d\'ouverture enregistré avec succès',
      });

      form.reset();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Solde d'Ouverture
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cashier_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Caissier</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un caissier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cashiers.map((cashier) => (
                        <SelectItem key={cashier.userId} value={cashier.userId}>
                          {getRoleLabel(cashier.role)} - {cashier.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="usd_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant USD</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cdf_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant CDF</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Enregistrement...' : 'Enregistrer le Solde d\'Ouverture'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default OpeningBalanceForm;
