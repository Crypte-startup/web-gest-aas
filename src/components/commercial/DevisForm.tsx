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
import { Check, ChevronsUpDown, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

interface DevisItem {
  id?: string;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  prix_total: number;
}

const DevisForm = ({ open, onClose, devis, onSuccess }: DevisFormProps) => {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<DevisFormData>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [items, setItems] = useState<DevisItem[]>([]);
  const [newItem, setNewItem] = useState<DevisItem>({
    designation: '',
    quantite: 1,
    prix_unitaire: 0,
    prix_total: 0
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const selectedClientId = watch('client_id');
  const selectedDevise = watch('devise');

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
      fetchDevisItems(devis.id);
    } else {
      reset();
      setItems([]);
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

  useEffect(() => {
    const total = items.reduce((sum, item) => sum + item.prix_total, 0);
    setValue('montant', total);
  }, [items, setValue]);

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

  const fetchDevisItems = async (devisId: string) => {
    const { data, error } = await supabase
      .from('devis_items')
      .select('*')
      .eq('devis_id', devisId);

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les articles',
        variant: 'destructive',
      });
      return;
    }

    setItems(data || []);
  };

  const handleNewItemChange = (field: keyof DevisItem, value: string | number) => {
    const updated = { ...newItem, [field]: value };
    if (field === 'quantite' || field === 'prix_unitaire') {
      updated.prix_total = updated.quantite * updated.prix_unitaire;
    }
    setNewItem(updated);
  };

  const addItem = () => {
    if (!newItem.designation || newItem.quantite <= 0 || newItem.prix_unitaire <= 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs',
        variant: 'destructive',
      });
      return;
    }

    setItems([...items, newItem]);
    setNewItem({
      designation: '',
      quantite: 1,
      prix_unitaire: 0,
      prix_total: 0
    });
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: DevisFormData) => {
    if (!user) return;
    if (items.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez ajouter au moins un article',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (devis) {
        // Update devis
        const { error: devisError } = await supabase
          .from('devis')
          .update(data)
          .eq('id', devis.id);

        if (devisError) throw devisError;

        // Delete old items
        const { error: deleteError } = await supabase
          .from('devis_items')
          .delete()
          .eq('devis_id', devis.id);

        if (deleteError) throw deleteError;

        // Insert new items
        const itemsToInsert = items.map(item => ({
          devis_id: devis.id,
          designation: item.designation,
          quantite: item.quantite,
          prix_unitaire: item.prix_unitaire,
          prix_total: item.prix_total
        }));

        const { error: itemsError } = await supabase
          .from('devis_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;

        toast({
          title: 'Succès',
          description: 'Devis modifié avec succès',
        });
      } else {
        // Create devis
        const { data: newDevis, error: devisError } = await supabase
          .from('devis')
          .insert([{ ...data, created_by: user.id }])
          .select()
          .single();

        if (devisError) throw devisError;

        // Insert items
        const itemsToInsert = items.map(item => ({
          devis_id: newDevis.id,
          designation: item.designation,
          quantite: item.quantite,
          prix_unitaire: item.prix_unitaire,
          prix_total: item.prix_total
        }));

        const { error: itemsError } = await supabase
          .from('devis_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;

        toast({
          title: 'Succès',
          description: 'Devis créé avec succès',
        });
      }

      reset();
      setItems([]);
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

  const totalMontant = items.reduce((sum, item) => sum + item.prix_total, 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {devis ? 'Modifier le devis' : 'Créer un devis'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
              <Select onValueChange={(value) => setValue('devise', value)} defaultValue={selectedDevise}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">Dollars (USD)</SelectItem>
                  <SelectItem value="CDF">Francs (CDF)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motif">Motif</Label>
            <Input
              id="motif"
              {...register('motif')}
              placeholder="Motif du devis"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Articles</Label>
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-5">
                  <Label>Désignation</Label>
                  <Input
                    value={newItem.designation}
                    onChange={(e) => handleNewItemChange('designation', e.target.value)}
                    placeholder="Description de l'article"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Quantité</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={newItem.quantite}
                    onChange={(e) => handleNewItemChange('quantite', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Prix unitaire</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItem.prix_unitaire}
                    onChange={(e) => handleNewItemChange('prix_unitaire', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Prix total</Label>
                  <Input
                    type="number"
                    value={newItem.prix_total.toFixed(2)}
                    disabled
                  />
                </div>
                <div className="col-span-1 flex items-end">
                  <Button type="button" onClick={addItem} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {items.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Désignation</TableHead>
                    <TableHead className="text-right">Quantité</TableHead>
                    <TableHead className="text-right">Prix unitaire</TableHead>
                    <TableHead className="text-right">Prix total</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.designation}</TableCell>
                      <TableCell className="text-right">{item.quantite}</TableCell>
                      <TableCell className="text-right">{item.prix_unitaire.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{item.prix_total.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-bold">Total:</TableCell>
                    <TableCell className="text-right font-bold">{totalMontant.toFixed(2)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
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

export default DevisForm;
