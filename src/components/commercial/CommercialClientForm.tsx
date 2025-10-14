import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface CommercialClientFormProps {
  open: boolean;
  onClose: () => void;
  client?: any;
  onSuccess: () => void;
}

interface CommercialClientFormData {
  nom: string;
  postnom: string;
  prenom: string;
  sexe: string;
  date_naissance: string;
  lieu_naissance: string;
  adresse: string;
  email: string;
}

const CommercialClientForm = ({ open, onClose, client, onSuccess }: CommercialClientFormProps) => {
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CommercialClientFormData>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (client) {
      setValue('nom', client.nom || '');
      setValue('postnom', client.postnom || '');
      setValue('prenom', client.prenom || '');
      setValue('sexe', client.sexe || '');
      setValue('date_naissance', client.date_naissance || '');
      setValue('lieu_naissance', client.lieu_naissance || '');
      setValue('adresse', client.adresse || '');
      setValue('email', client.email || '');
    } else {
      reset();
    }
  }, [client, setValue, reset]);

  const onSubmit = async (data: CommercialClientFormData) => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      if (client) {
        const { error } = await supabase
          .from('commercial_clients')
          .update(data)
          .eq('id', client.id);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Client modifié avec succès',
        });
      } else {
        const { error } = await supabase
          .from('commercial_clients')
          .insert([{ ...data, created_by: user.id }]);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Client ajouté avec succès',
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {client ? 'Modifier le client' : 'Ajouter un client'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                {...register('nom', { required: 'Le nom est requis' })}
              />
              {errors.nom && (
                <p className="text-sm text-destructive">{errors.nom.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="postnom">Postnom</Label>
              <Input id="postnom" {...register('postnom')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom</Label>
              <Input id="prenom" {...register('prenom')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sexe">Sexe</Label>
              <Select onValueChange={(value) => setValue('sexe', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculin</SelectItem>
                  <SelectItem value="F">Féminin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_naissance">Date de naissance</Label>
              <Input
                id="date_naissance"
                type="date"
                {...register('date_naissance')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lieu_naissance">Lieu de naissance</Label>
              <Input id="lieu_naissance" {...register('lieu_naissance')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Input id="adresse" {...register('adresse')} />
            </div>
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

export default CommercialClientForm;
