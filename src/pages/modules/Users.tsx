import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Settings, Shield, Users, UserPlus, Copy, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { AppRole } from '@/hooks/useUserRole';

const ROLES: { value: AppRole; label: string }[] = [
  { value: 'admin', label: 'Administrateur' },
  { value: 'resp_compta', label: 'Responsable Comptabilité' },
  { value: 'caissier', label: 'Caissier' },
  { value: 'resp_clientele', label: 'Responsable Clientèle' },
  { value: 'prepose_clientele', label: 'Préposé Clientèle' },
  { value: 'resp_log', label: 'Responsable Logistique' },
  { value: 'prepose_log', label: 'Préposé Logistique' },
  { value: 'resp_rh', label: 'Responsable RH' },
  { value: 'prepose_rh', label: 'Préposé RH' },
  { value: 'resp_comm', label: 'Responsable Commercial' },
  { value: 'prepose_comm', label: 'Préposé Commercial' },
];

interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  roles: AppRole[];
}

const UsersManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('prepose_clientele');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name');

      if (profilesError) throw profilesError;

      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        email: profile.email || '',
        full_name: profile.full_name || '',
        roles: userRoles?.filter(ur => ur.user_id === profile.id).map(ur => ur.role as AppRole) || []
      })) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    if (!userName.trim() || !fullName.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setCreating(true);
    const email = `${userName.toLowerCase()}@acham.com`;
    const password = generatePassword();

    try {
      // Create user via Supabase Auth admin API (needs service role key)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Assign role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: selectedRole,
          });

        if (roleError) throw roleError;

        setGeneratedPassword(password);
        setShowPassword(true);
        toast.success('Utilisateur créé avec succès');
        fetchUsers();
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Erreur lors de la création de l\'utilisateur');
    } finally {
      setCreating(false);
    }
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    toast.success('Mot de passe copié');
  };

  const resetForm = () => {
    setUserName('');
    setFullName('');
    setSelectedRole('prepose_clientele');
    setGeneratedPassword('');
    setShowPassword(false);
    setIsCreateDialogOpen(false);
  };

  const adminCount = users.filter(u => u.roles.includes('admin')).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground">
            Gérer les utilisateurs, rôles et permissions
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Créer un utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
              <DialogDescription>
                L'email sera automatiquement généré avec @acham.com
              </DialogDescription>
            </DialogHeader>
            {!generatedPassword ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="userName">Identifiant (avant @acham.com)</Label>
                  <Input
                    id="userName"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="ex: jdupont"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Email: {userName.toLowerCase() || '...'}@acham.com
                  </p>
                </div>
                <div>
                  <Label htmlFor="fullName">Nom complet</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jean Dupont"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Rôle</Label>
                  <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AppRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map(role => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateUser} disabled={creating} className="w-full">
                  {creating ? 'Création...' : 'Créer l\'utilisateur'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg space-y-2">
                  <p className="font-medium text-green-900 dark:text-green-100">Utilisateur créé avec succès!</p>
                  <div className="space-y-2">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Email: <strong>{userName.toLowerCase()}@acham.com</strong>
                    </p>
                    <div>
                      <p className="text-sm text-green-800 dark:text-green-200 mb-1">Mot de passe:</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 rounded border text-sm">
                          {showPassword ? generatedPassword : '••••••••••••'}
                        </code>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={copyPassword}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                    ⚠️ Conservez ce mot de passe en lieu sûr. Il ne sera plus affiché.
                  </p>
                </div>
                <Button onClick={resetForm} className="w-full">Fermer</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              Comptes actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rôles</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">11</div>
            <p className="text-xs text-muted-foreground">
              Rôles disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Settings className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminCount}</div>
            <p className="text-xs text-muted-foreground">
              Administrateurs
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Liste des utilisateurs
          </CardTitle>
          <CardDescription>
            Gérer les comptes utilisateurs et leurs rôles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun utilisateur trouvé
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom complet</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length > 0 ? (
                          user.roles.map(role => (
                            <span
                              key={role}
                              className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                            >
                              {ROLES.find(r => r.value === role)?.label || role}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">Aucun rôle</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersManagement;