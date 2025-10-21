import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface DevisFormProps {
  open: boolean;
  onClose: () => void;
  devis?: any;
  onSuccess: () => void;
}

interface DevisFormData {
  client_id: string;
  client_name: string;
  devise: string;
  montant: number;
  motif: string;
}

const DevisForm = ({ open, onClose, devis, onSuccess }: DevisFormProps) => {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<DevisFormData>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const selectedClientId = watch('client_id');

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (devis) {
      setValue('client_id', devis.client_id || '');
      setValue('client_name', devis.client_name || '');
      setValue('devise', devis.devise || '');
      setValue('montant', devis.montant || 0);
      setValue('motif', devis.motif || '');
    } else {
      reset();
    }
  }, [devis, setValue, reset]);

  useEffect(() => {
    if (selectedClientId) {
      const client = clients.find(c => c.id === selectedClientId);
      if (client) {
        setValue('client_name', client.name);
      }
    }
  }, [selectedClientId, clients, setValue]);

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les clients',
        variant: 'destructive',
      });
      return;
    }

    setClients(data || []);
  };

  const onSubmit = async (data: DevisFormData) => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      if (devis) {
        const { error } = await supabase
          .from('devis')
          .update(data)
          .eq('id', devis.id);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Devis modifié avec succès',
        });
      } else {
        const { error } = await supabase
          .from('devis')
          .insert([{ ...data, created_by: user.id }]);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Devis créé avec succès',
        });
      }

      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {devis ? 'Modifier le devis' : 'Créer un devis'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client_id">Client *</Label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="w-full justify-between"
                >
                  {selectedClientId
                    ? clients.find((client) => client.id === selectedClientId)?.name || "Sélectionner un client..."
                    : "Sélectionner un client..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Rechercher un client..." />
                  <CommandList>
                    <CommandEmpty>Aucun client trouvé.</CommandEmpty>
                    <CommandGroup>
                      {clients.map((client) => (
                        <CommandItem
                          key={client.id}
                          value={client.name}
                          onSelect={() => {
                            setValue('client_id', client.id);
                            setOpenCombobox(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedClientId === client.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {client.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="devise">Devise *</Label>
            <Select onValueChange={(value) => setValue('devise', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">Dollars (USD)</SelectItem>
                <SelectItem value="CDF">Francs (CDF)</SelectItem>
              </SelectContent>
            </Select>
            {errors.devise && (
              <p className="text-sm text-destructive">{errors.devise.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="montant">Montant *</Label>
            <Input
              id="montant"
              type="number"
              step="0.01"
              {...register('montant', {
                required: 'Le montant est requis',
                min: { value: 0, message: 'Le montant doit être positif' }
              })}
            />
            {errors.montant && (
              <p className="text-sm text-destructive">{errors.montant.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="motif">Motif</Label>
            <Input
              id="motif"
              {...register('motif')}
              placeholder="Motif du devis"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DevisForm;
