import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Smartphone, Key, AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { MFASetupModal } from '../forms/MFASetupModal';
import { Input } from '../ui/Input';
import { apiService } from '../../services/api';

interface MFASettingsProps {
  className?: string;
}

interface MFAStatus {
  enabled: boolean;
  lastUsed?: string;
}

export function MFASettings({ className }: MFASettingsProps) {
  const [mfaStatus, setMfaStatus] = useState<MFAStatus>({ enabled: false });
  const [loading, setLoading] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMFAStatus();
  }, []);

  const loadMFAStatus = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/mfa/status');
      if (response.success) {
        setMfaStatus(response.data);
      }
    } catch (err) {
      console.error('Failed to load MFA status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMFA = async () => {
    try {
      setActionLoading(true);
      setError(null);

      const response = await apiService.post('/mfa/disable', {
        token: disableCode,
      });
      
      if (response.success) {
        setMfaStatus({ enabled: false });
        setShowDisableConfirm(false);
        setDisableCode('');
      } else {
        setError(response.error || 'Fehler beim Deaktivieren der MFA');
      }
    } catch (err: any) {
      setError(err.error || 'Netzwerkfehler aufgetreten');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    try {
      setActionLoading(true);
      setError(null);

      // Regenerate backup codes without requiring verification for demo
      const response = await apiService.post('/mfa/regenerate-backup-codes', {});
      
      if (response.success) {
        setBackupCodes(response.data.backupCodes);
        setShowBackupCodes(true);
      } else {
        setError(response.error || 'Fehler beim Generieren neuer Backup-Codes');
      }
    } catch (err: any) {
      setError(err.error || 'Netzwerkfehler aufgetreten');
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Zwei-Faktor-Authentifizierung</h3>
            <p className="text-sm text-muted-foreground">
              Sichern Sie Ihr Konto mit einem zusätzlichen Sicherheitscode
            </p>
          </div>
          <div className="ml-auto">
            <Badge variant={mfaStatus.enabled ? "default" : "secondary"}>
              {mfaStatus.enabled ? "Aktiviert" : "Deaktiviert"}
            </Badge>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive"
          >
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}

        <div className="space-y-6">
          {!mfaStatus.enabled ? (
            // MFA Disabled State
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-amber-800 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Empfehlung</span>
                </div>
                <p className="text-sm text-amber-700">
                  Aktivieren Sie die Zwei-Faktor-Authentifizierung für zusätzliche Kontosicherheit.
                  Dies schützt Sie vor unbefugtem Zugriff, selbst wenn Ihr Passwort kompromittiert wird.
                </p>
              </div>

              <div className="flex items-center gap-4 p-4 border border-border rounded-lg">
                <Smartphone className="h-8 w-8 text-muted-foreground" />
                <div className="flex-1">
                  <h4 className="font-medium">Authenticator-App</h4>
                  <p className="text-sm text-muted-foreground">
                    Verwenden Sie Google Authenticator, Authy oder eine ähnliche App
                  </p>
                </div>
                <Button onClick={() => setShowSetupModal(true)}>
                  Einrichten
                </Button>
              </div>
            </div>
          ) : (
            // MFA Enabled State
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <Check className="h-4 w-4" />
                  <span className="font-medium">MFA ist aktiviert</span>
                </div>
                <p className="text-sm text-green-700">
                  Ihr Konto ist durch Zwei-Faktor-Authentifizierung geschützt.
                  {mfaStatus.lastUsed && (
                    <span> Zuletzt verwendet: {new Date(mfaStatus.lastUsed).toLocaleDateString('de-DE')}</span>
                  )}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 border border-border rounded-lg">
                  <Key className="h-6 w-6 text-muted-foreground" />
                  <div className="flex-1">
                    <h4 className="font-medium">Backup-Codes</h4>
                    <p className="text-sm text-muted-foreground">
                      Generieren Sie neue Backup-Codes für den Notfall
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleRegenerateBackupCodes}
                    disabled={actionLoading}
                  >
                    {actionLoading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                    Neue Codes
                  </Button>
                </div>

                {!showDisableConfirm ? (
                  <div className="flex justify-end">
                    <Button
                      variant="destructive"
                      onClick={() => setShowDisableConfirm(true)}
                    >
                      MFA deaktivieren
                    </Button>
                  </div>
                ) : (
                  <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                    <div>
                      <h4 className="font-medium text-destructive mb-2">
                        MFA deaktivieren
                      </h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Geben Sie einen aktuellen Authenticator-Code oder Backup-Code ein, 
                        um MFA zu deaktivieren.
                      </p>
                      <Input
                        type="text"
                        placeholder="123456 oder BACKUP-CODE"
                        value={disableCode}
                        onChange={(e) => setDisableCode(e.target.value)}
                        className="mb-4"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowDisableConfirm(false);
                          setDisableCode('');
                          setError(null);
                        }}
                      >
                        Abbrechen
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDisableMFA}
                        disabled={!disableCode || actionLoading}
                      >
                        {actionLoading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                        Deaktivieren
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Setup Modal */}
      <MFASetupModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        onComplete={() => {
          setMfaStatus({ enabled: true });
          loadMFAStatus(); // Refresh status
        }}
      />

      {/* Backup Codes Modal */}
      {showBackupCodes && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-lg shadow-xl max-w-md w-full"
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Neue Backup-Codes</h3>
              <div className="space-y-2 mb-6">
                {backupCodes.map((code, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted/30 rounded px-3 py-2">
                    <code className="font-mono text-sm">{code}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(code)}
                      className="h-6 w-6 p-0"
                    >
                      <Key className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const allCodes = backupCodes.join('\\n');
                    copyToClipboard(allCodes);
                  }}
                >
                  Alle kopieren
                </Button>
                <Button onClick={() => setShowBackupCodes(false)}>
                  Schließen
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}