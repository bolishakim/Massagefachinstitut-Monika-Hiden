import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  Trash2, 
  Shield, 
  Cookie, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  FileText,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Alert } from '@/components/ui/Alert';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { apiService } from '@/services/api';

interface ConsentSettings {
  NECESSARY: boolean;
  SYSTEM_OPTIMIZATION: boolean;
  NOTIFICATIONS: boolean;
  AUDIT_MONITORING: boolean;
}

interface DataExportRequest {
  id: string;
  status: string;
  createdAt: string;
  downloadUrl?: string;
  expiresIn?: string;
}

export function GDPRSettings() {
  const [consents, setConsents] = useState<ConsentSettings>({
    NECESSARY: true,
    SYSTEM_OPTIMIZATION: false,
    NOTIFICATIONS: false,
    AUDIT_MONITORING: false,
  });
  
  const [exportRequest, setExportRequest] = useState<DataExportRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load current consent settings
  useEffect(() => {
    loadConsentSettings();
  }, []);

  const loadConsentSettings = async () => {
    try {
      const response = await apiService.get('/gdpr/consent');
      if (response.success) {
        setConsents(response.data);
      }
    } catch (error) {
      console.error('Error loading consent settings:', error);
    }
  };

  const updateConsent = async (consentType: keyof ConsentSettings, granted: boolean) => {
    try {
      setIsLoading(true);
      
      const response = await apiService.post('/gdpr/consent', {
        consentType,
        granted,
        consentString: `Staff member ${granted ? 'granted' : 'revoked'} consent for ${consentType.toLowerCase().replace('_', ' ')} processing`,
      });

      if (response.success) {
        setConsents(prev => ({ ...prev, [consentType]: granted }));
        setMessage({
          type: 'success',
          text: `Einwilligung für ${consentType.toLowerCase()} wurde ${granted ? 'erteilt' : 'widerrufen'}`,
        });
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Fehler beim Speichern der Einwilligung',
      });
      console.error('Error updating consent:', error);
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const requestDataExport = async () => {
    try {
      setIsLoading(true);
      setMessage({ type: 'info', text: 'Datenexport wird vorbereitet...' });

      const response = await apiService.post('/gdpr/export-data');
      
      if (response.success) {
        setExportRequest({
          id: response.data.requestId,
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
          downloadUrl: response.data.downloadUrl,
          expiresIn: response.data.expiresIn,
        });
        
        setMessage({
          type: 'success',
          text: 'Datenexport erfolgreich erstellt. Sie können Ihre Daten jetzt herunterladen.',
        });
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Fehler beim Erstellen des Datenexports',
      });
      console.error('Error requesting data export:', error);
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(null), 10000);
    }
  };

  const downloadData = async () => {
    if (!exportRequest?.downloadUrl) return;

    try {
      setMessage({
        type: 'info',
        text: 'Download wird vorbereitet...',
      });

      // Fetch the file as a blob through our API service
      // The backend returns /api/gdpr/download-export/... so we need the base URL without /api
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3050/api';
      const serverBaseUrl = baseUrl.replace(/\/api$/, ''); // Remove /api from the end
      const downloadUrl = exportRequest.downloadUrl.startsWith('http') 
        ? exportRequest.downloadUrl 
        : `${serverBaseUrl}${exportRequest.downloadUrl}`;
        
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Download failed:', response.status, errorText);
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `mitarbeiterdaten-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setMessage({
        type: 'success',
        text: 'Download erfolgreich gestartet',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Fehler beim Download der Daten',
      });
      console.error('Error downloading data:', error);
    } finally {
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const requestAccountDeletion = async () => {
    try {
      setIsLoading(true);
      
      const response = await apiService.delete('/gdpr/delete-account', {
        data: { confirmDeletion: true },
      });
      
      if (response.success) {
        setMessage({
          type: 'success',
          text: 'Ihr Konto und alle Daten wurden erfolgreich gelöscht. Sie werden automatisch abgemeldet.',
        });
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          window.location.href = '/auth';
        }, 3000);
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Fehler beim Löschen des Kontos',
      });
      console.error('Error deleting account:', error);
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const getConsentDescription = (type: keyof ConsentSettings) => {
    switch (type) {
      case 'NECESSARY':
        return 'Erforderlich für Login, Navigation und grundlegende Systemfunktionen. Kann nicht deaktiviert werden.';
      case 'SYSTEM_OPTIMIZATION':
        return 'Sammelt Performance-Daten zur Verbesserung der Anwendungsgeschwindigkeit und Benutzererfahrung.';
      case 'NOTIFICATIONS':
        return 'Ermöglicht personalisierte Einstellungen für interne Benachrichtigungen und Mitteilungen.';
      case 'AUDIT_MONITORING':
        return 'Zusätzliche Protokollierung für erweiterte Compliance-Überwachung und Sicherheitsanalysen.';
      default:
        return '';
    }
  };

  const getConsentIcon = (type: keyof ConsentSettings) => {
    switch (type) {
      case 'NECESSARY':
        return <Shield className="w-5 h-5 text-green-600" />;
      case 'SYSTEM_OPTIMIZATION':
        return <Cookie className="w-5 h-5 text-blue-600" />;
      case 'NOTIFICATIONS':
        return <Cookie className="w-5 h-5 text-purple-600" />;
      case 'AUDIT_MONITORING':
        return <Lock className="w-5 h-5 text-orange-600" />;
      default:
        return <Cookie className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <div className="flex items-center gap-2">
            {message.type === 'success' && <CheckCircle className="w-4 h-4" />}
            {message.type === 'error' && <AlertTriangle className="w-4 h-4" />}
            {message.type === 'info' && <Clock className="w-4 h-4" />}
            {message.text}
          </div>
        </Alert>
      )}

      {/* Consent Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cookie className="w-5 h-5" />
            Mitarbeiter-Datenschutz-Einstellungen
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Verwalten Sie Ihre Einwilligungen für optionale Datenverarbeitungen
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(consents).map(([type, granted]) => (
            <div 
              key={type}
              className="flex items-start justify-between p-4 border rounded-lg"
            >
              <div className="flex items-start gap-3 flex-1">
                {getConsentIcon(type as keyof ConsentSettings)}
                <div>
                  <h4 className="font-medium">
                    {type === 'NECESSARY' ? 'Systemfunktionen' :
                     type === 'SYSTEM_OPTIMIZATION' ? 'Systemoptimierung' :
                     type === 'NOTIFICATIONS' ? 'Benachrichtigungen' :
                     type === 'AUDIT_MONITORING' ? 'Erweiterte Überwachung' :
                     'Unbekannt'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {getConsentDescription(type as keyof ConsentSettings)}
                  </p>
                </div>
              </div>
              <Checkbox
                checked={granted}
                disabled={type === 'NECESSARY' || isLoading}
                onChange={(e) => updateConsent(type as keyof ConsentSettings, e.target.checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Datenexport (Art. 20 DSGVO)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Laden Sie eine Kopie aller Ihrer gespeicherten Daten herunter
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm">
              Sie haben das Recht, eine Kopie aller von uns über Sie gespeicherten Daten 
              in einem maschinenlesbaren Format zu erhalten. Der Export enthält:
            </p>
            <ul className="text-sm space-y-1 ml-4">
              <li>• Mitarbeiterdaten (Name, E-Mail, Rolle, Abteilung)</li>
              <li>• Authentifizierungsdaten (Login-Verlauf, Sessions)</li>
              <li>• Patientenzugriffsprotokolle (wer, was, wann)</li>
              <li>• Systemdaten (Audit-Logs, Compliance-Protokolle)</li>
              <li>• Einwilligungen und persönliche Präferenzen</li>
            </ul>
          </div>

          {exportRequest ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Export bereit
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    Erstellt am: {new Date(exportRequest.createdAt).toLocaleDateString('de-DE')}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    Verfügbar für: {exportRequest.expiresIn}
                  </p>
                </div>
                <Button
                  onClick={downloadData}
                  variant="outline"
                  size="sm"
                  className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Herunterladen
                </Button>
              </div>
            </motion.div>
          ) : (
            <Button 
              onClick={requestDataExport} 
              disabled={isLoading}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              {isLoading ? 'Export wird erstellt...' : 'Datenexport anfordern'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Account Deletion */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Mitarbeiterkonto löschen (Art. 17 DSGVO)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Permanente Löschung Ihres Mitarbeiterkontos und aller zugehörigen Daten
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <div>
              <p className="font-medium">Achtung: Diese Aktion kann nicht rückgängig gemacht werden</p>
              <p className="text-sm mt-1">
                Durch das Löschen Ihres Kontos werden alle Ihre Daten permanent entfernt:
              </p>
              <ul className="text-sm mt-2 space-y-1">
                <li>• Persönliche Mitarbeiterdaten und Kontoinformationen</li>
                <li>• Login-Verlauf und Authentifizierungsdaten</li>
                <li>• Alle persönlichen Audit-Logs und Systemdaten</li>
                <li>• Einwilligungen und persönliche Präferenzen</li>
              </ul>
              <p className="text-sm mt-2 font-medium">
                Hinweis: Patientenzugriffsprotokolle können gemäß österreichischem Gesundheitsrecht 
                erst nach Ablauf der gesetzlichen Aufbewahrungsfristen (30 Jahre) gelöscht werden.
                Diese werden anonymisiert, aber nicht vollständig gelöscht.
              </p>
            </div>
          </Alert>

          <div className="pt-4">
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="destructive"
              disabled={isLoading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Konto permanent löschen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Weitere Informationen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/privacy-policy"
              target="_blank"
              className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <FileText className="w-4 h-4 text-primary" />
              <span>Datenschutzerklärung</span>
            </a>
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-sm">DSGVO-konform</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Für weitere Fragen zum Mitarbeiter-Datenschutz kontaktieren Sie uns unter: privacy@medicalcenter.com<br/>
            Datenschutzbeauftragter: dpo@medicalcenter.com
          </p>
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={requestAccountDeletion}
        title="Konto permanent löschen"
        message="Sind Sie sicher, dass Sie Ihr Konto und alle Daten permanent löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden."
        confirmText="Ja, Konto löschen"
        cancelText="Abbrechen"
        variant="danger"
        isLoading={isLoading}
      />
    </div>
  );
}