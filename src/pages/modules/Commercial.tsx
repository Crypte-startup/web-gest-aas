import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, FileText, Receipt } from 'lucide-react';
import CommercialClientList from '@/components/commercial/CommercialClientList';
import DevisList from '@/components/commercial/DevisList';
import FactureList from '@/components/commercial/FactureList';

const Commercial = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Commercial</h1>
        <p className="text-muted-foreground">
          Gestion des clients, devis et factures
        </p>
      </div>

      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clients
          </TabsTrigger>
          <TabsTrigger value="devis" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Devis
          </TabsTrigger>
          <TabsTrigger value="factures" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Factures
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="mt-4">
          <CommercialClientList />
        </TabsContent>

        <TabsContent value="devis" className="mt-4">
          <DevisList />
        </TabsContent>

        <TabsContent value="factures" className="mt-4">
          <FactureList />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Commercial;
