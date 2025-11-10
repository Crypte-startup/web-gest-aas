import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Pencil, Trash2, Loader2, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCompanySettings } from '@/hooks/useCompanySettings';

interface ClientListProps {
  clients: any[];
  isLoading: boolean;
  onEdit: (client: any) => void;
  onDelete: (clientId: string) => void;
  onAdd: () => void;
}

const handlePrintAll = (clients: any[], settings: any) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const clientRows = clients
    .map(
      (client) => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${client.name}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${client.postnom || '-'}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${client.prenom || '-'}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${client.date_naissance ? format(new Date(client.date_naissance), 'dd/MM/yyyy', { locale: fr }) : '-'}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${client.phone || '-'}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${client.email || '-'}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${client.ecole || '-'}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${client.classe || '-'}</td>
      </tr>
    `
    )
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Liste des Clients - Clientèle</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #f4f4f4; border: 1px solid #ddd; padding: 12px; text-align: left; }
          td { border: 1px solid #ddd; padding: 8px; }
          .print-date { text-align: right; margin-bottom: 10px; color: #666; }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>LISTE DES CLIENTS - CLIENTÈLE</h1>
        <div class="print-date">Date: ${new Date().toLocaleDateString('fr-FR')}</div>
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Postnom</th>
              <th>Prénom</th>
              <th>Date naissance</th>
              <th>Téléphone</th>
              <th>Email</th>
              <th>École</th>
              <th>Classe</th>
            </tr>
          </thead>
          <tbody>
            ${clientRows}
          </tbody>
        </table>
        <div style="margin-top: 20px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">Imprimer</button>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
};

const handlePrintOne = (client: any, settings: any) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Fiche Client - ${client.name}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            padding: 40px; 
            max-width: 900px; 
            margin: 0 auto;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
          }
          
          .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          
          .header-banner {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            color: white;
            position: relative;
            overflow: hidden;
          }
          
          .header-banner::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -10%;
            width: 300px;
            height: 300px;
            background: rgba(255,255,255,0.1);
            border-radius: 50%;
          }
          
          .header-content {
            position: relative;
            z-index: 2;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .logo-section {
            display: flex;
            align-items: center;
            gap: 15px;
          }
          
          .logo { 
            width: 100px; 
            height: auto;
            background: white;
            padding: 10px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          
          .company-name {
            font-size: 24px;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          
          .company-info { 
            text-align: right;
            font-size: 11px;
            line-height: 1.8;
            opacity: 0.95;
          }
          
          .company-info strong { 
            display: block;
            font-weight: 500;
          }
          
          .document-header {
            padding: 30px;
            background: linear-gradient(to right, #f8f9fa, #ffffff);
            border-bottom: 3px solid #667eea;
          }
          
          .document-title { 
            text-align: center;
            font-size: 32px;
            font-weight: 700;
            color: #2d3748;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 10px;
          }
          
          .print-date { 
            text-align: center;
            color: #718096;
            font-size: 13px;
            font-weight: 500;
          }
          
          .content-wrapper {
            padding: 40px;
          }
          
          .client-photo-section { 
            text-align: center;
            margin-bottom: 40px;
            position: relative;
          }
          
          .photo-frame {
            display: inline-block;
            position: relative;
            padding: 8px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
          }
          
          .client-photo { 
            width: 180px;
            height: 180px;
            border-radius: 50%;
            object-fit: cover;
            border: 6px solid white;
            box-shadow: 0 8px 20px rgba(0,0,0,0.15);
          }
          
          .info-sections {
            display: grid;
            gap: 30px;
          }
          
          .info-section {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          }
          
          .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #667eea;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #667eea;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .section-icon {
            width: 24px;
            height: 24px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 700;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }
          
          .info-item {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }
          
          .info-label { 
            font-weight: 600;
            font-size: 12px;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .info-value { 
            font-size: 15px;
            color: #2d3748;
            font-weight: 500;
            padding: 8px 12px;
            background: white;
            border-radius: 6px;
            border-left: 3px solid #667eea;
          }
          
          .footer { 
            margin-top: 40px;
            padding: 25px;
            background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
            color: white;
            text-align: center;
            font-size: 12px;
            line-height: 1.8;
          }
          
          .footer strong {
            display: block;
            font-size: 13px;
            margin-bottom: 5px;
            color: #a0aec0;
          }
          
          @media print {
            body { 
              background: white;
              padding: 0;
            }
            button { display: none; }
            .container {
              box-shadow: none;
              border-radius: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header-banner">
            <div class="header-content">
              <div class="logo-section">
                ${settings?.logo_url ? `<img src="${settings.logo_url}" alt="Logo" class="logo" />` : `<img src="/logo.png" alt="Logo" class="logo" />`}
                <div class="company-name">${settings?.company_name || 'AMARA CHAM SARL'}</div>
              </div>
              <div class="company-info">
                <strong>RCCM: ${settings?.rccm || 'CD/LSI/RCCM/24-B-745'}</strong>
                <strong>ID.NAT: ${settings?.id_nat || '05-H4901-N70222J'}</strong>
                <strong>NIF: ${settings?.nif || 'A2434893E'}</strong>
                <strong>TEL: ${settings?.phone || '+243 82 569 21 21'}</strong>
                <strong>MAIL: ${settings?.email || 'info@amarachamsarl.com'}</strong>
              </div>
            </div>
          </div>
          
          <div class="document-header">
            <div class="document-title">Fiche Client</div>
            <div class="print-date">Imprimé le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
          
          <div class="content-wrapper">
            ${client.photo_url ? `
            <div class="client-photo-section">
              <div class="photo-frame">
                <img src="${client.photo_url}" alt="Photo ${client.name}" class="client-photo" />
              </div>
            </div>
             ` : ''}
            <div class="info-sections">
              <div class="info-section">
                <div class="section-title">
                  <span class="section-icon">👤</span>
                  Informations Personnelles
                </div>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Nom</span>
                    <span class="info-value">${client.name}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Postnom</span>
                    <span class="info-value">${client.postnom || '-'}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Prénom</span>
                    <span class="info-value">${client.prenom || '-'}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Date de naissance</span>
                    <span class="info-value">${client.date_naissance ? format(new Date(client.date_naissance), 'dd/MM/yyyy', { locale: fr }) : '-'}</span>
                  </div>
                </div>
              </div>
              
              <div class="info-section">
                <div class="section-title">
                  <span class="section-icon">📞</span>
                  Coordonnées
                </div>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Téléphone</span>
                    <span class="info-value">${client.phone || '-'}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Email</span>
                    <span class="info-value">${client.email || '-'}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Domicile</span>
                    <span class="info-value">${client.domicile || '-'}</span>
                  </div>
                </div>
              </div>
              
              <div class="info-section">
                <div class="section-title">
                  <span class="section-icon">🎓</span>
                  Informations Scolaires
                </div>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">École</span>
                    <span class="info-value">${client.ecole || '-'}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Classe</span>
                    <span class="info-value">${client.classe || '-'}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Adresse école</span>
                    <span class="info-value">${client.adresse_ecole || '-'}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Trajet</span>
                    <span class="info-value">${client.trajet || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
           
          <div class="footer">
            <strong>ADRESSE</strong>
            ${settings?.address || '1144 avenue maître mawanga'}<br/>
            ${settings?.city || 'Quartier Ile du golf, Commune de Likasi'}, ${settings?.province || 'Haut Katanga'}<br/>
            ${settings?.country || 'République Démocratique du Congo'}
          </div>
        </div>
        
        <div style="margin: 30px; text-align: center;">
          <button onclick="window.print()" style="padding: 15px 40px; font-size: 16px; cursor: pointer; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); font-weight: 600; transition: transform 0.2s;">Imprimer la fiche</button>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
};

const ClientList = ({ clients, isLoading, onEdit, onDelete, onAdd }: ClientListProps) => {
  const { settings } = useCompanySettings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">Aucun client enregistré pour le moment</p>
        <Button onClick={onAdd}>
          <UserPlus className="w-4 h-4 mr-2" />
          Ajouter un client
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Button onClick={() => handlePrintAll(clients, settings)} disabled={clients.length === 0}>
          <Printer className="w-4 h-4 mr-2" />
          Imprimer la liste
        </Button>
        <Button onClick={onAdd}>
          <UserPlus className="w-4 h-4 mr-2" />
          Ajouter un client
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Photo</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Postnom</TableHead>
              <TableHead>Prénom</TableHead>
              <TableHead>Date de naissance</TableHead>
              <TableHead>École</TableHead>
              <TableHead>Classe</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  {client.photo_url ? (
                    <img
                      src={client.photo_url}
                      alt={client.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {client.name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>{client.postnom || '-'}</TableCell>
                <TableCell>{client.prenom || '-'}</TableCell>
                <TableCell>
                  {client.date_naissance 
                    ? format(new Date(client.date_naissance), 'dd/MM/yyyy', { locale: fr })
                    : '-'
                  }
                </TableCell>
                <TableCell>{client.ecole || '-'}</TableCell>
                <TableCell>{client.classe || '-'}</TableCell>
                <TableCell>{client.phone || '-'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                  <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePrintOne(client, settings)}
                      title="Imprimer ce client"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(client)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(client.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ClientList;
