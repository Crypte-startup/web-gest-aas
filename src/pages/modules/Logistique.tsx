import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Package, FileText, CheckCircle, Clock, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ReceiptForm from '@/components/logistique/ReceiptForm';
import ReceiptList from '@/components/logistique/ReceiptList';

const Logistique = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<any>(null);

  const { data: receipts = [], refetch } = useQuery({
    queryKey: ['logistics-receipts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ledger')
        .select('*')
        .eq('entry_kind', 'LOGISTIQUE')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const totalReceipts = receipts.length;
  const pendingReceipts = receipts.filter(r => 
    r.status === 'ENREGISTRE' || r.status === 'PENDING_RESP' || r.status === 'PENDING_ADMIN'
  ).length;
  const approvedReceipts = receipts.filter(r => r.status === 'APPROUVE' || r.status === 'VALIDE').length;
  
  const totalAmount = receipts
    .filter(r => r.status === 'APPROUVE' || r.status === 'VALIDE')
    .reduce((sum, r) => {
      if (r.currency === 'USD') {
        return sum + Number(r.amount);
      }
      return sum;
    }, 0);

  const handleEdit = (receipt: any) => {
    setEditingReceipt(receipt);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingReceipt(null);
  };

  const handleSuccess = () => {
    refetch();
    handleCloseForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Logistique</h1>
          <p className="text-muted-foreground">
            Gestion des reçus et opérations logistiques
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingReceipt(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau reçu
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingReceipt ? 'Modifier le reçu' : 'Nouveau reçu logistique'}
              </DialogTitle>
            </DialogHeader>
            <ReceiptForm 
              receipt={editingReceipt} 
              onSuccess={handleSuccess}
              onCancel={handleCloseForm}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total reçus</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReceipts}</div>
            <p className="text-xs text-muted-foreground">
              Reçus logistiques
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReceipts}</div>
            <p className="text-xs text-muted-foreground">
              À valider
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approuvés</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedReceipts}</div>
            <p className="text-xs text-muted-foreground">
              Reçus approuvés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solde ops</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Opérations logistiques
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Reçus logistiques
          </CardTitle>
          <CardDescription>
            Liste des reçus et leur statut
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReceiptList 
            receipts={receipts} 
            onEdit={handleEdit}
            onDelete={refetch}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Logistique;
