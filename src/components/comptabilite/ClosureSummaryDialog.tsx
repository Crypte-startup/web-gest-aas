import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ClosureSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  openingBalance: { usd: number; cdf: number };
  currentBalance: { usd: number; cdf: number };
  expectedBalance: { usd: number; cdf: number };
  todayRecettes: { usd: number; cdf: number };
  todayDepenses: { usd: number; cdf: number };
  gaps: { usd: number; cdf: number };
  onConfirm: (notes: string) => Promise<void>;
  isSubmitting?: boolean;
}

export const ClosureSummaryDialog = ({
  open,
  onOpenChange,
  openingBalance,
  currentBalance,
  expectedBalance,
  todayRecettes,
  todayDepenses,
  gaps,
  onConfirm,
  isSubmitting = false,
}: ClosureSummaryDialogProps) => {
  const [notes, setNotes] = useState('');

  const hasGap = gaps.usd !== 0 || gaps.cdf !== 0;

  const handleConfirm = async () => {
    await onConfirm(notes);
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Clôture de journée</DialogTitle>
          <DialogDescription>
            Vérifiez les détails avant de confirmer la clôture de votre journée
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Soldes d'ouverture */}
          <div>
            <h3 className="font-semibold mb-2">Soldes d'ouverture</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-muted p-3 rounded-md">
                <span className="text-muted-foreground">USD:</span>{' '}
                <span className="font-medium">
                  ${openingBalance.usd.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-muted p-3 rounded-md">
                <span className="text-muted-foreground">CDF:</span>{' '}
                <span className="font-medium">
                  {openingBalance.cdf.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Transactions du jour */}
          <div>
            <h3 className="font-semibold mb-2">Transactions du jour</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-green-50 dark:bg-green-950 p-3 rounded-md border border-green-200 dark:border-green-800">
                  <div className="text-xs text-muted-foreground mb-1">Recettes USD</div>
                  <div className="font-semibold text-green-700 dark:text-green-400">
                    +${todayRecettes.usd.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-950 p-3 rounded-md border border-green-200 dark:border-green-800">
                  <div className="text-xs text-muted-foreground mb-1">Recettes CDF</div>
                  <div className="font-semibold text-green-700 dark:text-green-400">
                    +{todayRecettes.cdf.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-red-50 dark:bg-red-950 p-3 rounded-md border border-red-200 dark:border-red-800">
                  <div className="text-xs text-muted-foreground mb-1">Dépenses USD</div>
                  <div className="font-semibold text-red-700 dark:text-red-400">
                    -${todayDepenses.usd.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-950 p-3 rounded-md border border-red-200 dark:border-red-800">
                  <div className="text-xs text-muted-foreground mb-1">Dépenses CDF</div>
                  <div className="font-semibold text-red-700 dark:text-red-400">
                    -{todayDepenses.cdf.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Comparaison : Attendu vs Réel */}
          <div>
            <h3 className="font-semibold mb-2">Comparaison des soldes</h3>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-muted-foreground mb-1">Solde calculé (attendu)</div>
                  <div className="font-medium">
                    USD: ${expectedBalance.usd.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="font-medium">
                    CDF: {expectedBalance.cdf.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Solde réel (actuel)</div>
                  <div className="font-medium">
                    USD: ${currentBalance.usd.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="font-medium">
                    CDF: {currentBalance.cdf.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC
                  </div>
                </div>
              </div>

              {/* Écarts */}
              {hasGap && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="font-semibold text-destructive">Écarts détectés</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    {gaps.usd !== 0 && (
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">USD</Badge>
                        <span className="font-medium">
                          {gaps.usd > 0 ? '+' : ''}
                          ${gaps.usd.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({gaps.usd > 0 ? 'Excédent' : 'Manquant'})
                        </span>
                      </div>
                    )}
                    {gaps.cdf !== 0 && (
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">CDF</Badge>
                        <span className="font-medium">
                          {gaps.cdf > 0 ? '+' : ''}
                          {gaps.cdf.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({gaps.cdf > 0 ? 'Excédent' : 'Manquant'})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!hasGap && (
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md p-3">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <span className="font-semibold">✓ Aucun écart détecté</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Montants qui seront transférés */}
          <div>
            <h3 className="font-semibold mb-2">Montants à transférer</h3>
            <div className="bg-primary/10 p-3 rounded-md">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>USD:</span>
                  <span className="font-semibold">
                    ${currentBalance.usd.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>CDF:</span>
                  <span className="font-semibold">
                    {currentBalance.cdf.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Ces montants seront transférés au Responsable Comptabilité et votre solde sera remis à 0.
            </p>
          </div>

          {/* Notes/Commentaires */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes / Commentaires {hasGap && '(Expliquez l\'écart)'}</Label>
            <Textarea
              id="notes"
              placeholder={
                hasGap
                  ? 'Veuillez expliquer la raison de l\'écart...'
                  : 'Ajoutez des notes ou commentaires (optionnel)'
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmer la clôture
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
