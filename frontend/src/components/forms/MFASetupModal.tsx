import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Shield, Copy, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { apiService } from '../../services/api';

interface MFASetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface SetupStep {
  qrCodeUrl: string;
  backupCodes: string[];
  secret: string;
}

export function MFASetupModal({ isOpen, onClose, onComplete }: MFASetupModalProps) {
  const [currentStep, setCurrentStep] = useState<'setup' | 'verify' | 'backup-codes'>('setup');
  const [setupData, setSetupData] = useState<SetupStep | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Step 1: Generate QR Code and Secret
  const handleSetupMFA = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.post('/mfa/setup');
      
      if (response.success) {
        setSetupData(response.data);
        setCurrentStep('verify');
      } else {
        setError(response.error || 'Failed to setup MFA');
      }
    } catch (err: any) {
      setError(err.error || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify TOTP Code
  const handleVerifyCode = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.post('/mfa/enable', {
        token: verificationCode,
      });
      
      if (response.success) {
        setCurrentStep('backup-codes');
      } else {
        setError(response.error || 'Invalid verification code');
      }
    } catch (err: any) {
      setError(err.error || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleComplete = () => {
    onComplete();
    onClose();
    // Reset state for next time
    setCurrentStep('setup');
    setSetupData(null);
    setVerificationCode('');
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">
              Zwei-Faktor-Authentifizierung einrichten
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Setup */}
          {currentStep === 'setup' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">
                  Zusätzliche Sicherheit für Ihr Konto
                </h3>
                <p className="text-muted-foreground">
                  Die Zwei-Faktor-Authentifizierung schützt Ihr Konto mit einem zusätzlichen Sicherheitscode 
                  aus Ihrer Authenticator-App.
                </p>
              </div>

              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-medium mb-2">Voraussetzungen:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Google Authenticator, Authy oder eine ähnliche App</li>
                  <li>• Zugang zu Ihrem Smartphone oder Tablet</li>
                  <li>• Sichere Aufbewahrung der Backup-Codes</li>
                </ul>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSetupMFA} disabled={loading}>
                  {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Einrichtung starten
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: QR Code and Verification */}
          {currentStep === 'verify' && setupData && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">QR-Code scannen</h3>
                <p className="text-muted-foreground">
                  Scannen Sie den QR-Code mit Ihrer Authenticator-App und geben Sie den generierten Code ein.
                </p>
              </div>

              <div className="flex justify-center">
                <Card className="p-4 bg-white">
                  <img
                    src={setupData.qrCodeUrl}
                    alt="QR Code für MFA Setup"
                    className="w-48 h-48"
                  />
                </Card>
              </div>

              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Manueller Schlüssel:</p>
                    <code className="text-xs bg-background px-2 py-1 rounded mt-1 block">
                      {setupData.secret}
                    </code>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(setupData.secret, 'secret')}
                  >
                    {copiedCode === 'secret' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Bestätigungscode aus Ihrer App:
                  </label>
                  <Input
                    type="text"
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\\D/g, '').slice(0, 6))}
                    className="text-center text-lg font-mono"
                    maxLength={6}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setCurrentStep('setup')}>
                    Zurück
                  </Button>
                  <Button
                    onClick={handleVerifyCode}
                    disabled={loading || verificationCode.length !== 6}
                  >
                    {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                    Verifizieren
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Backup Codes */}
          {currentStep === 'backup-codes' && setupData && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2 text-green-600">
                  MFA erfolgreich aktiviert!
                </h3>
                <p className="text-muted-foreground">
                  Speichern Sie diese Backup-Codes sicher. Sie können diese verwenden, 
                  wenn Sie keinen Zugang zu Ihrer Authenticator-App haben.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-amber-800 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Wichtig:</span>
                </div>
                <p className="text-sm text-amber-700">
                  Jeder Code kann nur einmal verwendet werden. Bewahren Sie diese an einem sicheren Ort auf.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {setupData.backupCodes.map((code, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-muted/30 rounded px-3 py-2"
                  >
                    <code className="font-mono text-sm">{code}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(code, `backup-${index}`)}
                      className="h-6 w-6 p-0"
                    >
                      {copiedCode === `backup-${index}` ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const allCodes = setupData.backupCodes.join('\\n');
                    copyToClipboard(allCodes, 'all-codes');
                  }}
                >
                  {copiedCode === 'all-codes' ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  Alle kopieren
                </Button>
                <Button onClick={handleComplete}>
                  Fertigstellen
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}