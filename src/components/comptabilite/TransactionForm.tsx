import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Printer, Save } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

const transactionSchema = z.object({
  type: z.enum(['RECETTE', 'DEPENSE']),
  currency: z.enum(['USD', 'CDF']),
  amount: z.string().min(1, 'Le montant est requis'),
  client_name: z.string().min(1, 'Le nom du client est requis'),
  motif: z.string().min(1, 'Le motif est requis').max(500),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const TransactionForm = ({ onSuccess, onCancel }: TransactionFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'RECETTE',
      currency: 'USD',
      amount: '',
      client_name: '',
      motif: '',
    },
  });

  const generateEntryId = async () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    
    // Récupérer toutes les transactions du jour qui commencent par ACHAM-dateStr
    const { data: existingTransactions } = await supabase
      .from('ledger')
      .select('entry_id')
      .like('entry_id', `ACHAM-${dateStr}-%`)
      .order('created_at', { ascending: false })
      .limit(1);

    let counter = 1;
    if (existingTransactions && existingTransactions.length > 0) {
      const lastId = existingTransactions[0].entry_id;
      const lastCounter = parseInt(lastId.split('-')[2]);
      counter = lastCounter + 1;
    }

    return `ACHAM-${dateStr}-${counter.toString().padStart(3, '0')}`;
  };

  const onSubmit = async (data: TransactionFormData) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Vous devez être connecté',
        });
        return;
      }

      // Vérifier si l'utilisateur est resp_compta ou caissier
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const autoValidateRoles = ['resp_compta', 'caissier', 'caissier1', 'caissier2', 'caissier3', 'caissier4', 'caissier5'];
      const shouldAutoValidate = roles?.some(r => autoValidateRoles.includes(r.role));

      const entryId = await generateEntryId();

      const transactionData = {
        entry_id: entryId,
        entry_kind: data.type,
        currency: data.currency as Database['public']['Enums']['currency'],
        amount: parseFloat(data.amount),
        client_name: data.client_name,
        motif: data.motif,
        created_by: user.id,
        account_owner: user.id,
        // Le comptable et les caissiers créent des transactions directement validées
        status: (shouldAutoValidate ? 'VALIDE' : 'ENREGISTRE') as Database['public']['Enums']['entry_status'],
      };

      const { error } = await supabase
        .from('ledger')
        .insert([transactionData]);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: shouldAutoValidate 
          ? 'Transaction validée et enregistrée avec succès' 
          : 'Transaction enregistrée avec succès',
      });

      onSuccess();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Transaction Comptable</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #2c5f2d; }
            .transaction { border: 2px solid #2c5f2d; padding: 20px; border-radius: 8px; }
            .field { margin: 10px 0; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="transaction">
            <h1>Transaction Comptable</h1>
            <div class="field"><span class="label">Type:</span> ${form.getValues('type')}</div>
            <div class="field"><span class="label">Client:</span> ${form.getValues('client_name')}</div>
            <div class="field"><span class="label">Motif:</span> ${form.getValues('motif')}</div>
            <div class="field"><span class="label">Devise:</span> ${form.getValues('currency')}</div>
            <div class="field"><span class="label">Montant:</span> ${form.getValues('amount')} ${form.getValues('currency')}</div>
            <div class="field"><span class="label">Date:</span> ${new Date().toLocaleDateString('fr-FR')}</div>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="RECETTE">Recette</SelectItem>
                  <SelectItem value="DEPENSE">Dépense</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="client_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du client</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Nom complet du client" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="motif"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motif</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Description du motif de la transaction"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Devise</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="CDF">CDF</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Montant</FormLabel>
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

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={isLoading} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={handlePrint}
            disabled={!form.formState.isValid}
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TransactionForm;
