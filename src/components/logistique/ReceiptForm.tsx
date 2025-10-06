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

const receiptSchema = z.object({
  motif: z.string().min(1, 'Le motif est requis').max(500),
  currency: z.enum(['USD', 'CDF']),
  amount: z.string().min(1, 'Le montant est requis'),
});

type ReceiptFormData = z.infer<typeof receiptSchema>;

interface ReceiptFormProps {
  receipt?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const ReceiptForm = ({ receipt, onSuccess, onCancel }: ReceiptFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ReceiptFormData>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      motif: receipt?.motif || '',
      currency: receipt?.currency || 'USD',
      amount: receipt?.amount?.toString() || '',
    },
  });

  const generateEntryId = async () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    
    const { data: existingReceipts } = await supabase
      .from('ledger')
      .select('entry_id')
      .eq('entry_kind', 'LOGISTIQUE')
      .like('entry_id', `LOG-${dateStr}-%`)
      .order('created_at', { ascending: false })
      .limit(1);

    let counter = 1;
    if (existingReceipts && existingReceipts.length > 0) {
      const lastId = existingReceipts[0].entry_id;
      const lastCounter = parseInt(lastId.split('-')[2]);
      counter = lastCounter + 1;
    }

    return `LOG-${dateStr}-${counter.toString().padStart(3, '0')}`;
  };

  const onSubmit = async (data: ReceiptFormData) => {
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

      const entryId = receipt ? receipt.entry_id : await generateEntryId();

      const receiptData = {
        motif: data.motif,
        currency: data.currency as Database['public']['Enums']['currency'],
        amount: parseFloat(data.amount),
        entry_id: entryId,
        entry_kind: 'LOGISTIQUE',
        created_by: user.id,
        status: 'ENREGISTRE' as Database['public']['Enums']['entry_status'],
      };

      if (receipt) {
        const { error } = await supabase
          .from('ledger')
          .update(receiptData)
          .eq('id', receipt.id);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Le reçu a été modifié avec succès',
        });
      } else {
        const { error } = await supabase
          .from('ledger')
          .insert([receiptData]);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Le reçu a été créé avec succès',
        });
      }

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
    const entryId = receipt?.entry_id || 'En attente...';
    const printContent = `
      <html>
        <head>
          <title>Reçu Logistique</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #2c5f2d; }
            .receipt { border: 2px solid #2c5f2d; padding: 20px; border-radius: 8px; }
            .field { margin: 10px 0; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <h1>Reçu Logistique</h1>
            <div class="field"><span class="label">ID d'entrée:</span> ${entryId}</div>
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
        {receipt && (
          <div className="p-3 bg-muted rounded-md">
            <span className="text-sm font-medium">ID d'entrée: </span>
            <span className="text-sm font-mono">{receipt.entry_id}</span>
          </div>
        )}

        <FormField
          control={form.control}
          name="motif"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motif</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Description du motif du reçu"
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
            {receipt ? 'Modifier' : 'Enregistrer'}
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

export default ReceiptForm;