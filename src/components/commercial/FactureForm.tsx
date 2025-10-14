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

interface FactureFormProps {
  open: boolean;
  onClose: () => void;
  facture?: any;
  onSuccess: () => void;
}

interface FactureFormData {
  client_id: string;
  client_name: string;
  devise: string;
  montant: number;
}

const FactureForm = ({ open, onClose, facture, onSuccess }: FactureFormProps) => {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FactureFormData>();
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
    if (facture) {
      setValue('client_id', facture.client_id || '');
      setValue('client_name', facture.client_name || '');
      setValue('devise', facture.devise || '');
      setValue('montant', facture.montant || 0);
    } else {
      reset();
    }
  }, [facture, setValue, reset]);

  useEffect(() => {
    if (selectedClientId) {
      const client = clients.find(c => c.id === selectedClientId);
      if (client) {
        const fullName = `${client.nom} ${client.postnom || ''} ${client.prenom || ''}`.trim();
        setValue('client_name', fullName);
      }
    }
  }, [selectedClientId, clients, setValue]);

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('commercial_clients')
      .select('*')
      .order('nom');

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

  const onSubmit = async (data: FactureFormData) => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      if (facture) {
        const { error } = await supabase
          .from('facture')
          .update(data)
          .eq('id', facture.id);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Facture modifiée avec succès',
        });
      } else {
        const { error } = await supabase
          .from('facture')
          .insert([{ ...data, created_by: user.id }]);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Facture créée avec succès',
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
            {facture ? 'Modifier la facture' : 'Créer une facture'}
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
                    ? clients.find((client) => client.id === selectedClientId)
                        ? `${clients.find((client) => client.id === selectedClientId).nom} ${clients.find((client) => client.id === selectedClientId).postnom || ''} ${clients.find((client) => client.id === selectedClientId).prenom || ''}`.trim()
                        : "Sélectionner un client..."
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
                          value={`${client.nom} ${client.postnom || ''} ${client.prenom || ''}`}
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
                          {client.nom} {client.postnom} {client.prenom}
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

export default FactureForm;
