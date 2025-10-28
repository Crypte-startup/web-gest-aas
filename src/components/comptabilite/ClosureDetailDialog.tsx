import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Calendar, User } from 'lucide-react';

interface ClosureTransfer {
  id: string;
  cashier_id: string;
  cashier_role: string;
  closing_date: string;
  opening_balance_usd: number;
  opening_balance_cdf: number;
  closing_balance_usd: number;
  closing_balance_cdf: number;
  transferred_usd: number;
  transferred_cdf: number;
  expected_balance_usd: number;
  expected_balance_cdf: number;
  gap_usd: number;
  gap_cdf: number;
  notes: string | null;
  created_at: string;
  profiles?: {
    email: string;
    full_name: string | null;
  };
}

interface ClosureDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  closure: ClosureTransfer;
}

export const ClosureDetailDialog = ({
  open,
  onOpenChange,
  closure,
}: ClosureDetailDialogProps) => {
  const hasGap = closure.gap_usd !== 0 || closure.gap_cdf !== 0;
  const recettesUsd = closure.expected_balance_usd - closure.opening_balance_usd + (closure.expected_balance_usd < closure.opening_balance_usd ? closure.opening_balance_usd - closure.expected_balance_usd : 0);
  const recettesCdf = closure.expected_balance_cdf - closure.opening_balance_cdf + (closure.expected_balance_cdf < closure.opening_balance_cdf ? closure.opening_balance_cdf - closure.expected_balance_cdf : 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Détails de la Clôture</DialogTitle>
          <DialogDescription>
            Rapport complet de la clôture de journée
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informations générales */}
          <div className="bg-muted p-4 rounded-md space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">Date de clôture:</span>
              <span>{new Date(closure.closing_date).toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">Caissier:</span>
              <span>
                {closure.profiles?.full_name || closure.profiles?.email || 'N/A'}
              </span>
              <Badge variant="outline" className="capitalize">
                {closure.cashier_role}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Clôture effectuée le {new Date(closure.created_at).toLocaleString('fr-FR')}
            </div>
          </div>

          <Separator />

          {/* Soldes d'ouverture */}
          <div>
            <h3 className="font-semibold mb-2">Soldes d'ouverture</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-muted p-3 rounded-md">
                <span className="text-muted-foreground">USD:</span>{' '}
                <span className="font-medium">
                  ${closure.opening_balance_usd.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-muted p-3 rounded-md">
                <span className="text-muted-foreground">CDF:</span>{' '}
                <span className="font-medium">
                  {closure.opening_balance_cdf.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Soldes calculés vs réels */}
          <div>
            <h3 className="font-semibold mb-2">Comparaison des soldes</h3>
            <div className="space-y-3">
              {/* USD */}
              <div className="border rounded-md p-3">
                <div className="font-medium mb-2">USD</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground mb-1">Solde calculé (attendu)</div>
                    <div className="text-lg font-semibold">
                      ${closure.expected_balance_usd.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Solde réel (clôture)</div>
                    <div className="text-lg font-semibold">
                      ${closure.closing_balance_usd.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
                {closure.gap_usd !== 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Écart</Badge>
                      <span className="font-semibold text-destructive">
                        {closure.gap_usd > 0 ? '+' : ''}
                        ${closure.gap_usd.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({closure.gap_usd > 0 ? 'Excédent' : 'Manquant'})
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* CDF */}
              <div className="border rounded-md p-3">
                <div className="font-medium mb-2">CDF</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground mb-1">Solde calculé (attendu)</div>
                    <div className="text-lg font-semibold">
                      {closure.expected_balance_cdf.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Solde réel (clôture)</div>
                    <div className="text-lg font-semibold">
                      {closure.closing_balance_cdf.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC
                    </div>
                  </div>
                </div>
                {closure.gap_cdf !== 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Écart</Badge>
                      <span className="font-semibold text-destructive">
                        {closure.gap_cdf > 0 ? '+' : ''}
                        {closure.gap_cdf.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({closure.gap_cdf > 0 ? 'Excédent' : 'Manquant'})
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Montants transférés */}
          <div>
            <h3 className="font-semibold mb-2">Montants transférés</h3>
            <div className="bg-primary/10 p-3 rounded-md">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>USD:</span>
                  <span className="font-semibold">
                    ${closure.transferred_usd.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>CDF:</span>
                  <span className="font-semibold">
                    {closure.transferred_cdf.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Alerte si écart */}
          {hasGap && (
            <>
              <Separator />
              <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="font-semibold text-destructive">Attention: Écarts détectés</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Des écarts ont été détectés entre les soldes calculés et les soldes réels. 
                  Veuillez vérifier les transactions du jour pour identifier la source de l'écart.
                </p>
              </div>
            </>
          )}

          {/* Notes du caissier */}
          {closure.notes && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Notes du caissier</h3>
                <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap">
                  {closure.notes}
                </div>
              </div>
            </>
          )}

          {/* Statut global */}
          <Separator />
          <div className="flex items-center justify-between">
            <span className="font-semibold">Statut de la clôture:</span>
            {hasGap ? (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Avec écart
              </Badge>
            ) : (
              <Badge variant="default" className="bg-green-600">
                ✓ Conforme
              </Badge>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
