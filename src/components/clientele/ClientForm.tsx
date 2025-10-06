import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload, Save, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';

interface ClientFormProps {
  open: boolean;
  onClose: () => void;
  client?: any;
  onSuccess: () => void;
}

interface ClientFormData {
  nom: string;
  postnom: string;
  prenom: string;
  date_naissance: Date | undefined;
  domicile: string;
  ecole: string;
  adresse_ecole: string;
  classe: string;
  trajet: string;
  phone: string;
  email: string;
}

const ClientForm = ({ open, onClose, client, onSuccess }: ClientFormProps) => {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ClientFormData>({
    defaultValues: {
      nom: '',
      postnom: '',
      prenom: '',
      date_naissance: undefined,
      domicile: '',
      ecole: '',
      adresse_ecole: '',
      classe: '',
      trajet: '',
      phone: '',
      email: '',
    }
  });

  const dateNaissance = watch('date_naissance');

  useEffect(() => {
    if (client) {
      reset({
        nom: client.name || '',
        postnom: client.postnom || '',
        prenom: client.prenom || '',
        date_naissance: client.date_naissance ? new Date(client.date_naissance) : undefined,
        domicile: client.domicile || '',
        ecole: client.ecole || '',
        adresse_ecole: client.adresse_ecole || '',
        classe: client.classe || '',
        trajet: client.trajet || '',
        phone: client.phone || '',
        email: client.email || '',
      });
      if (client.photo_url) {
        setPhotoPreview(client.photo_url);
      }
    } else {
      reset();
      setPhotoPreview(null);
      setPhotoFile(null);
    }
  }, [client, reset]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (clientId: string) => {
    if (!photoFile) return null;

    const fileExt = photoFile.name.split('.').pop();
    const fileName = `${clientId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('client-photos')
      .upload(filePath, photoFile, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('client-photos')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const onSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let photoUrl = client?.photo_url;

      if (client) {
        // Update existing client
        if (photoFile) {
          photoUrl = await uploadPhoto(client.id);
        }

        const { error } = await supabase
          .from('clients')
          .update({
            name: data.nom,
            postnom: data.postnom,
            prenom: data.prenom,
            date_naissance: data.date_naissance?.toISOString().split('T')[0],
            domicile: data.domicile,
            ecole: data.ecole,
            adresse_ecole: data.adresse_ecole,
            classe: data.classe,
            trajet: data.trajet,
            phone: data.phone,
            email: data.email,
            photo_url: photoUrl,
          })
          .eq('id', client.id);

        if (error) throw error;
        toast.success('Client modifié avec succès');
      } else {
        // Create new client
        const { data: newClient, error: insertError } = await supabase
          .from('clients')
          .insert({
            name: data.nom,
            postnom: data.postnom,
            prenom: data.prenom,
            date_naissance: data.date_naissance?.toISOString().split('T')[0],
            domicile: data.domicile,
            ecole: data.ecole,
            adresse_ecole: data.adresse_ecole,
            classe: data.classe,
            trajet: data.trajet,
            phone: data.phone,
            email: data.email,
            created_by: user.id,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        if (photoFile && newClient) {
          photoUrl = await uploadPhoto(newClient.id);
          const { error: updateError } = await supabase
            .from('clients')
            .update({ photo_url: photoUrl })
            .eq('id', newClient.id);

          if (updateError) throw updateError;
        }

        toast.success('Client enregistré avec succès');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error('Erreur lors de l\'enregistrement du client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {client ? 'Modifier le client' : 'Ajouter un client'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                {...register('nom', { required: 'Le nom est requis' })}
                placeholder="Nom"
              />
              {errors.nom && <p className="text-sm text-destructive">{errors.nom.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="postnom">Postnom</Label>
              <Input
                id="postnom"
                {...register('postnom')}
                placeholder="Postnom"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom</Label>
              <Input
                id="prenom"
                {...register('prenom')}
                placeholder="Prénom"
              />
            </div>

            <div className="space-y-2">
              <Label>Date de naissance</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateNaissance && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateNaissance ? format(dateNaissance, 'PPP', { locale: fr }) : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateNaissance}
                    onSelect={(date) => setValue('date_naissance', date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="domicile">Domicile</Label>
              <Input
                id="domicile"
                {...register('domicile')}
                placeholder="Adresse du domicile"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ecole">École</Label>
              <Input
                id="ecole"
                {...register('ecole')}
                placeholder="Nom de l'école"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adresse_ecole">Adresse de l'école</Label>
              <Input
                id="adresse_ecole"
                {...register('adresse_ecole')}
                placeholder="Adresse de l'école"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="classe">Classe</Label>
              <Input
                id="classe"
                {...register('classe')}
                placeholder="Classe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trajet">Trajet</Label>
              <Input
                id="trajet"
                {...register('trajet')}
                placeholder="Description du trajet"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="Numéro de téléphone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="Adresse email"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="photo">Photo</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="flex-1"
                />
                {photoPreview && (
                  <img
                    src={photoPreview}
                    alt="Aperçu"
                    className="w-20 h-20 object-cover rounded-md"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrint}
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimer
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientForm;
