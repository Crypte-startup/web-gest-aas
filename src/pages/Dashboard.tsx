import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Package, Users, UserCircle, ShoppingCart, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { roles, loading } = useUserRole(user?.id);

  const modules = [
    {
      title: 'Comptabilité',
      description: 'Gestion des recettes, dépenses et soldes',
      icon: Calculator,
      roles: ['admin', 'resp_compta', 'caissier'],
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Logistique',
      description: 'Gestion des reçus et opérations logistiques',
      icon: Package,
      roles: ['admin', 'resp_log', 'prepose_log'],
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Clientèle',
      description: 'Gestion des clients et relations',
      icon: Users,
      roles: ['admin', 'resp_clientele', 'prepose_clientele'],
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Ressources Humaines',
      description: 'Gestion des employés et paie',
      icon: UserCircle,
      roles: ['admin', 'resp_rh', 'prepose_rh'],
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Commercial',
      description: 'Gestion des ventes et commandes',
      icon: ShoppingCart,
      roles: ['admin', 'resp_comm', 'prepose_comm'],
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
  ];

  const hasAccess = (requiredRoles: string[]) => {
    return requiredRoles.some(role => roles.includes(role as any));
  };

  const accessibleModules = modules.filter(module => hasAccess(module.roles));

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Bienvenue dans GEST-AAS - Système de gestion administrative et comptable
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {accessibleModules.map((module) => {
          const Icon = module.icon;
          return (
            <Card key={module.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${module.bgColor} mb-2`}>
                  <Icon className={`h-6 w-6 ${module.color}`} />
                </div>
                <CardTitle>{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  <span>Accès autorisé</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {accessibleModules.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Aucun module accessible</CardTitle>
            <CardDescription>
              Contactez l'administrateur pour obtenir les droits d'accès aux modules.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
