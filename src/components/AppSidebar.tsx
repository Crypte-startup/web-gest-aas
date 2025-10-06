import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calculator,
  Users,
  Package,
  UserCircle,
  ShoppingCart,
  Settings,
  LogOut,
  Building2,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const navigationItems = [
  { title: 'Tableau de bord', url: '/dashboard', icon: LayoutDashboard, roles: [] },
  { title: 'Comptabilité', url: '/dashboard/comptabilite', icon: Calculator, roles: ['admin', 'resp_compta', 'caissier'] },
  { title: 'Logistique', url: '/dashboard/logistique', icon: Package, roles: ['admin', 'resp_log', 'prepose_log'] },
  { title: 'Clientèle', url: '/dashboard/clientele', icon: Users, roles: ['admin', 'resp_clientele', 'prepose_clientele'] },
  { title: 'Ressources Humaines', url: '/dashboard/rh', icon: UserCircle, roles: ['admin', 'resp_rh', 'prepose_rh'] },
  { title: 'Commercial', url: '/dashboard/commercial', icon: ShoppingCart, roles: ['admin', 'resp_comm', 'prepose_comm'] },
  { title: 'Utilisateurs', url: '/dashboard/users', icon: Settings, roles: ['admin'] },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const { user, signOut } = useAuth();
  const { roles, hasRole } = useUserRole(user?.id);

  const canAccessRoute = (requiredRoles: string[]) => {
    if (requiredRoles.length === 0) return true;
    return requiredRoles.some(role => hasRole(role as any));
  };

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'bg-primary text-primary-foreground hover:bg-primary/90 font-medium'
      : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground';

  return (
    <Sidebar className={!open ? 'w-14' : 'w-64'} collapsible="icon">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          {open && <span className="font-semibold">GEST-AAS</span>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems
                .filter(item => canAccessRoute(item.roles))
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} end className={getNavClass}>
                        <item.icon className="h-4 w-4" />
                        {open && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="space-y-2">
          {open && user && (
            <div className="mb-2 space-y-1 text-sm">
              <p className="truncate font-medium">{user.email}</p>
              {roles.length > 0 && (
                <p className="truncate text-xs text-muted-foreground">
                  {roles.map(r => r.replace('_', ' ')).join(', ')}
                </p>
              )}
            </div>
          )}
          <Separator className="my-2" />
          <Button
            variant="ghost"
            size={!open ? 'icon' : 'default'}
            className="w-full justify-start"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            {open && <span className="ml-2">Déconnexion</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
