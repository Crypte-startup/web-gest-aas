import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Upload, Building2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

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

const Settings = () => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin } = useUserRole(user?.id);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single();

      if (error) throw error;
      setSettings(data);
      if (data.logo_url) {
        setLogoPreview(data.logo_url);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de charger les paramètres',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return settings?.logo_url || null;

    try {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `company/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('client-photos')
        .upload(filePath, logoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('client-photos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de télécharger le logo',
      });
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || !isAdmin) return;

    setIsSaving(true);
    try {
      const logoUrl = await uploadLogo();

      const { error } = await supabase
        .from('company_settings')
        .update({
          ...settings,
          logo_url: logoUrl,
        })
        .eq('id', settings.id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Paramètres enregistrés avec succès',
      });

      fetchSettings();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de sauvegarder les paramètres',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Accès refusé</CardTitle>
            <CardDescription>
              Seuls les administrateurs peuvent modifier les paramètres de l'entreprise.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Paramètres de l'entreprise</h1>
          <p className="text-muted-foreground">
            Gérez les informations de votre entreprise utilisées dans tous les documents
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Logo de l'entreprise</CardTitle>
            <CardDescription>
              Ce logo apparaîtra sur toutes les factures, devis et documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {logoPreview && (
              <div className="flex justify-center">
                <img
                  src={logoPreview}
                  alt="Logo aperçu"
                  className="h-32 w-auto object-contain border rounded-lg p-4"
                />
              </div>
            )}
            <div className="flex items-center gap-4">
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="flex-1"
              />
              <Button type="button" variant="outline" size="icon">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Nom de l'entreprise</Label>
                <Input
                  id="company_name"
                  value={settings?.company_name || ''}
                  onChange={(e) =>
                    setSettings((prev) => prev ? { ...prev, company_name: e.target.value } : null)
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={settings?.phone || ''}
                  onChange={(e) =>
                    setSettings((prev) => prev ? { ...prev, phone: e.target.value } : null)
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings?.email || ''}
                  onChange={(e) =>
                    setSettings((prev) => prev ? { ...prev, email: e.target.value } : null)
                  }
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informations légales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rccm">RCCM</Label>
                <Input
                  id="rccm"
                  value={settings?.rccm || ''}
                  onChange={(e) =>
                    setSettings((prev) => prev ? { ...prev, rccm: e.target.value } : null)
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="id_nat">ID National</Label>
                <Input
                  id="id_nat"
                  value={settings?.id_nat || ''}
                  onChange={(e) =>
                    setSettings((prev) => prev ? { ...prev, id_nat: e.target.value } : null)
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nif">NIF</Label>
                <Input
                  id="nif"
                  value={settings?.nif || ''}
                  onChange={(e) =>
                    setSettings((prev) => prev ? { ...prev, nif: e.target.value } : null)
                  }
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Adresse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={settings?.address || ''}
                onChange={(e) =>
                  setSettings((prev) => prev ? { ...prev, address: e.target.value } : null)
                }
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ville / Commune</Label>
                <Input
                  id="city"
                  value={settings?.city || ''}
                  onChange={(e) =>
                    setSettings((prev) => prev ? { ...prev, city: e.target.value } : null)
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="province">Province</Label>
                <Input
                  id="province"
                  value={settings?.province || ''}
                  onChange={(e) =>
                    setSettings((prev) => prev ? { ...prev, province: e.target.value } : null)
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Pays</Label>
                <Input
                  id="country"
                  value={settings?.country || ''}
                  onChange={(e) =>
                    setSettings((prev) => prev ? { ...prev, country: e.target.value } : null)
                  }
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving} size="lg">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer les paramètres
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
