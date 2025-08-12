import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Settings, X, Check, Info, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { useAuth } from '@/hooks/useAuth';

interface ConsentSettings {
  necessary: boolean;
  system_optimization: boolean;
  notifications: boolean;
  audit_monitoring: boolean;
}

interface CookieConsentBannerProps {
  onConsentChange?: (consents: ConsentSettings) => void;
}

const CONSENT_STORAGE_KEY = 'medical-center-consent';

export function CookieConsentBanner({ onConsentChange }: CookieConsentBannerProps) {
  const { user } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consents, setConsents] = useState<ConsentSettings>({
    necessary: true, // Always required for system function
    system_optimization: false,
    notifications: false,
    audit_monitoring: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Check if consent has already been given
  useEffect(() => {
    const savedConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!savedConsent) {
      setShowBanner(true);
    } else {
      try {
        const parsedConsent = JSON.parse(savedConsent);
        // Ensure all required fields exist for backwards compatibility
        const fullConsent = {
          necessary: true,
          system_optimization: false,
          notifications: false,
          audit_monitoring: false,
          ...parsedConsent
        };
        setConsents(fullConsent);
        onConsentChange?.(fullConsent);
      } catch (error) {
        console.error('Error parsing saved consent:', error);
        setShowBanner(true);
      }
    }
  }, [onConsentChange]);

  const saveConsent = async (consentData: ConsentSettings) => {
    setIsLoading(true);
    try {
      // Save to localStorage immediately for better UX
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentData));
      
      // Send consent to backend (works for both authenticated and anonymous users)
      const consentRecords = Object.entries(consentData).map(([type, granted]) => ({
        consentType: type.toUpperCase(), // system_optimization -> SYSTEM_OPTIMIZATION
        granted,
        consentString: `Staff member ${granted ? 'granted' : 'denied'} consent for ${type.replace('_', ' ')} processing`,
      }));

      try {
        if (user) {
          // User is authenticated - use the authenticated endpoint for each consent
          const token = localStorage.getItem('accessToken');
          console.log('Saving consent for authenticated user:', user.id, 'with token:', token ? 'present' : 'missing');
          
          const responses = await Promise.all(
            consentRecords.map(async consent => {
              const response = await fetch('/api/gdpr/consent', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(consent),
              });
              
              if (!response.ok) {
                const errorData = await response.text();
                console.error(`Failed to save consent for ${consent.consentType}:`, response.status, errorData);
              } else {
                console.log(`Successfully saved consent for ${consent.consentType}`);
              }
              
              return response;
            })
          );
        } else {
          // User is not authenticated - use anonymous endpoint for each consent
          console.log('Saving consent for anonymous user');
          await Promise.all(
            consentRecords.map(async consent => {
              const response = await fetch('/api/gdpr/anonymous-consent', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(consent),
              });
              
              if (!response.ok) {
                const errorData = await response.text();
                console.error(`Failed to save anonymous consent for ${consent.consentType}:`, response.status, errorData);
              }
              
              return response;
            })
          );
        }
      } catch (error) {
        console.error('Failed to save consent to server:', error);
        // Continue anyway - localStorage consent is sufficient for functionality
      }

      setConsents(consentData);
      onConsentChange?.(consentData);
      setShowBanner(false);
      
    } catch (error) {
      console.error('Error saving consent:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptAll = () => {
    const allConsents: ConsentSettings = {
      necessary: true,
      system_optimization: true,
      notifications: true,
      audit_monitoring: true,
    };
    saveConsent(allConsents);
  };

  const handleRejectAll = () => {
    const minimalConsents: ConsentSettings = {
      necessary: true,
      system_optimization: false,
      notifications: false,
      audit_monitoring: false,
    };
    saveConsent(minimalConsents);
  };

  const handleSavePreferences = () => {
    saveConsent(consents);
  };

  const handleConsentChange = (type: keyof ConsentSettings, value: boolean) => {
    setConsents(prev => ({
      ...prev,
      [type]: value,
    }));
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
      >
        <Card className="max-w-6xl mx-auto shadow-2xl border-2">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Cookie className="w-6 h-6 text-primary" />
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Cookies und Datenschutz
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Als Mitarbeiter des Medical Centers verwenden wir verschiedene Datenverarbeitungen für den Betrieb des Systems. 
                      Einige sind für die grundlegende Funktion erforderlich, andere sind optional und helfen uns, die Anwendung zu verbessern.
                      <br />
                      <a 
                        href="/privacy-policy" 
                        target="_blank"
                        className="text-primary hover:underline inline-flex items-center gap-1 mt-1"
                      >
                        <Info className="w-3 h-3" />
                        Vollständige Datenschutzerklärung für Mitarbeiter
                      </a>
                    </p>

                    {showDetails && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4 mb-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Shield className="w-4 h-4 text-green-600" />
                                  <span className="font-medium text-sm">Systemfunktionen</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Erforderlich für Login, Navigation und Grundfunktionen
                                </p>
                              </div>
                              <Checkbox
                                checked={consents.necessary}
                                disabled={true}
                                className="ml-2"
                              />
                            </div>

                            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Cookie className="w-4 h-4 text-blue-600" />
                                  <span className="font-medium text-sm">Systemoptimierung</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Performance-Daten zur Verbesserung der Anwendung
                                </p>
                              </div>
                              <Checkbox
                                checked={consents.system_optimization}
                                onChange={(e) => handleConsentChange('system_optimization', e.target.checked)}
                                className="ml-2"
                              />
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Cookie className="w-4 h-4 text-purple-600" />
                                  <span className="font-medium text-sm">Benachrichtigungen</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Persönliche Einstellungen für interne Mitteilungen
                                </p>
                              </div>
                              <Checkbox
                                checked={consents.notifications}
                                onChange={(e) => handleConsentChange('notifications', e.target.checked)}
                                className="ml-2"
                              />
                            </div>

                            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Shield className="w-4 h-4 text-orange-600" />
                                  <span className="font-medium text-sm">Erweiterte Überwachung</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Zusätzliche Audit-Protokollierung zur Compliance-Verbesserung
                                </p>
                              </div>
                              <Checkbox
                                checked={consents.audit_monitoring}
                                onChange={(e) => handleConsentChange('audit_monitoring', e.target.checked)}
                                className="ml-2"
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {!showDetails ? (
                        <>
                          <Button
                            onClick={handleAcceptAll}
                            disabled={isLoading}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Alle akzeptieren
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleRejectAll}
                            disabled={isLoading}
                          >
                            Nur notwendige
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setShowDetails(true)}
                            disabled={isLoading}
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Einstellungen
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            onClick={handleSavePreferences}
                            disabled={isLoading}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Auswahl speichern
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowDetails(false)}
                            disabled={isLoading}
                          >
                            Zurück
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRejectAll}
                    className="flex-shrink-0"
                    disabled={isLoading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {isLoading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}