import React, { useState } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Cookie,
  Key,
  Sun,
  Moon,
  Monitor,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { H2, H3, TextMD } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Checkbox } from '../components/ui/Checkbox';
import { Select } from '../components/ui/Select';
import { Stack } from '../components/ui/Layout';
import { Badge } from '../components/ui/Badge';
import { Divider } from '../components/ui/Layout';
import { Alert } from '../components/ui/Alert';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { MFASettings } from '../components/settings/MFASettings';
import { GDPRSettings } from '../components/gdpr/GDPRSettings';
import { userService } from '../services/user';

export function StaffProfilePage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
  });
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Password change states
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const { theme, setTheme, isDark } = useTheme();
  const { user, updateProfile } = useAuth();

  // Initialize form with user data
  React.useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const profileTabs = [
    { id: 'profile', label: 'Mein Profil', icon: User },
    { id: 'notifications', label: 'Benachrichtigungen', icon: Bell },
    { id: 'security', label: 'Sicherheit', icon: Shield },
    { id: 'privacy', label: 'Datenschutz (DSGVO)', icon: Cookie },
    { id: 'appearance', label: 'Erscheinungsbild', icon: Palette },
    { id: 'language', label: 'Sprache & Region', icon: Globe },
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'zh', label: '中文' },
  ];

  const timezoneOptions = [
    { value: 'utc', label: 'UTC' },
    { value: 'est', label: 'Eastern Time (EST)' },
    { value: 'pst', label: 'Pacific Time (PST)' },
    { value: 'cet', label: 'Central European Time (CET)' },
  ];

  const themeOptions = [
    { value: 'light', label: 'Hell' },
    { value: 'dark', label: 'Dunkel' },
    { value: 'system', label: 'System' },
  ];

  const handleProfileFormChange = (field: string, value: string) => {
    setProfileForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdateProfile = async () => {
    try {
      setIsUpdating(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      
      const result = await updateProfile(profileForm);
      
      if (result.success) {
        setSuccessMessage('Profil erfolgreich aktualisiert');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage(result.error || 'Fehler beim Aktualisieren des Profils');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setErrorMessage('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordFormChange = (field: string, value: string) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleChangePassword = async () => {
    try {
      setIsChangingPassword(true);
      setPasswordError(null);
      setPasswordSuccess(null);

      // Validation
      if (!passwordForm.currentPassword) {
        setPasswordError('Aktuelles Passwort ist erforderlich');
        return;
      }
      if (!passwordForm.newPassword) {
        setPasswordError('Neues Passwort ist erforderlich');
        return;
      }
      if (passwordForm.newPassword.length < 8) {
        setPasswordError('Neues Passwort muss mindestens 8 Zeichen lang sein');
        return;
      }
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setPasswordError('Neue Passwörter stimmen nicht überein');
        return;
      }
      if (passwordForm.currentPassword === passwordForm.newPassword) {
        setPasswordError('Das neue Passwort muss sich vom aktuellen unterscheiden');
        return;
      }

      const response = await userService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (response.success) {
        setPasswordSuccess('Passwort erfolgreich geändert');
        // Clear form
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        
        // Clear success message after 5 seconds
        setTimeout(() => setPasswordSuccess(null), 5000);
      } else {
        setPasswordError(response.error || 'Fehler beim Ändern des Passworts');
      }
    } catch (error) {
      console.error('Password change error:', error);
      setPasswordError('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <Stack space="lg">
            <div>
              <H3>Profilinformationen</H3>
              <TextMD className="text-muted-foreground mt-1">
                Aktualisieren Sie Ihre persönlichen Informationen und E-Mail-Adresse.
              </TextMD>
            </div>

            {/* Success Message */}
            {successMessage && (
              <Alert variant="success" dismissible onDismiss={() => setSuccessMessage(null)}>
                <CheckCircle className="h-4 w-4" />
                <div>
                  <h4 className="font-medium">Erfolg</h4>
                  <p className="text-sm">{successMessage}</p>
                </div>
              </Alert>
            )}

            {/* Error Message */}
            {errorMessage && (
              <Alert variant="destructive" dismissible onDismiss={() => setErrorMessage(null)}>
                <AlertCircle className="h-4 w-4" />
                <div>
                  <h4 className="font-medium">Fehler</h4>
                  <p className="text-sm">{errorMessage}</p>
                </div>
              </Alert>
            )}

            <Card className="p-6">
              <Stack space="md">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={`${user.firstName} ${user.lastName}`} className="w-20 h-20 rounded-full" />
                    ) : (
                      <span className="text-primary-foreground text-2xl font-bold">
                        {user?.firstName?.charAt(0).toUpperCase()}{user?.lastName?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <Button variant="outline" size="sm">Avatar ändern</Button>
                    <TextMD className="text-muted-foreground text-xs mt-1">
                      JPG, GIF oder PNG. Maximal 1MB.
                    </TextMD>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Vorname"
                    placeholder="Ihr Vorname"
                    value={profileForm.firstName}
                    onChange={(e) => handleProfileFormChange('firstName', e.target.value)}
                  />
                  <Input
                    label="Nachname"
                    placeholder="Ihr Nachname"
                    value={profileForm.lastName}
                    onChange={(e) => handleProfileFormChange('lastName', e.target.value)}
                  />
                </div>

                <Input
                  label="E-Mail-Adresse"
                  type="email"
                  placeholder="ihre.email@medicalcenter.com"
                  value={profileForm.email}
                  onChange={(e) => handleProfileFormChange('email', e.target.value)}
                />

                <Input
                  label="Telefonnummer"
                  type="tel"
                  placeholder="+43 xxx xxx xx xx"
                  value={profileForm.phone}
                  onChange={(e) => handleProfileFormChange('phone', e.target.value)}
                />

                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{user?.role === 'ADMIN' ? 'Administrator' : user?.role === 'MODERATOR' ? 'Supervisor' : 'Mitarbeiter'}</Badge>
                  {user?.specialization && (
                    <Badge variant="secondary">
                      {user.specialization === 'MEDICAL_MASSAGE' ? 'Medizinische Massage' :
                       user.specialization === 'PHYSIOTHERAPY' ? 'Physiotherapie' :
                       user.specialization === 'MASSAGE' ? 'Massage' :
                       user.specialization === 'HEILMASSAGE' ? 'Heilmassage' :
                       user.specialization === 'TRAINING' ? 'Training' :
                       user.specialization}
                    </Badge>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleUpdateProfile}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Wird aktualisiert...
                      </>
                    ) : (
                      'Profil aktualisieren'
                    )}
                  </Button>
                </div>
              </Stack>
            </Card>
          </Stack>
        );

      case 'notifications':
        return (
          <Stack space="lg">
            <div>
              <H3>Benachrichtigungen</H3>
              <TextMD className="text-muted-foreground mt-1">
                Verwalten Sie Ihre Benachrichtigungseinstellungen.
              </TextMD>
            </div>

            <Card className="p-6">
              <Stack space="lg">
                <div>
                  <H3 className="text-base mb-4">E-Mail-Benachrichtigungen</H3>
                  <Stack space="sm">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="email-appointments"
                        checked={notifications.email}
                        onChange={(e) => setNotifications(prev => ({ ...prev, email: e.target.checked }))}
                      />
                      <label htmlFor="email-appointments" className="text-sm">
                        Neue Termine und Terminänderungen
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="email-reminders"
                        checked={notifications.push}
                        onChange={(e) => setNotifications(prev => ({ ...prev, push: e.target.checked }))}
                      />
                      <label htmlFor="email-reminders" className="text-sm">
                        Tageszusammenfassung und Erinnerungen
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="email-system"
                        checked={notifications.sms}
                        onChange={(e) => setNotifications(prev => ({ ...prev, sms: e.target.checked }))}
                      />
                      <label htmlFor="email-system" className="text-sm">
                        System-Updates und wichtige Mitteilungen
                      </label>
                    </div>
                  </Stack>
                </div>

                <Divider />

                <div>
                  <H3 className="text-base mb-4">Browser-Benachrichtigungen</H3>
                  <div className="flex items-center justify-between">
                    <div>
                      <TextMD className="font-medium">Push-Benachrichtigungen</TextMD>
                      <TextMD className="text-muted-foreground text-sm">
                        Erhalten Sie Benachrichtigungen auch wenn die App geschlossen ist
                      </TextMD>
                    </div>
                    <Button variant="outline" size="sm">Aktivieren</Button>
                  </div>
                </div>
              </Stack>
            </Card>
          </Stack>
        );

      case 'security':
        return (
          <Stack space="lg">
            <div>
              <H3>Sicherheitseinstellungen</H3>
              <TextMD className="text-muted-foreground mt-1">
                Verwalten Sie Ihre Konto-Sicherheit und Authentifizierungsmethoden.
              </TextMD>
            </div>

            <Card className="p-6">
              <Stack space="lg">
                <div>
                  <H3 className="text-base mb-4">Passwort ändern</H3>
                  
                  {/* Password Success Message */}
                  {passwordSuccess && (
                    <Alert variant="success" dismissible onDismiss={() => setPasswordSuccess(null)}>
                      <CheckCircle className="h-4 w-4" />
                      <div>
                        <h4 className="font-medium">Erfolg</h4>
                        <p className="text-sm">{passwordSuccess}</p>
                      </div>
                    </Alert>
                  )}

                  {/* Password Error Message */}
                  {passwordError && (
                    <Alert variant="destructive" dismissible onDismiss={() => setPasswordError(null)}>
                      <AlertCircle className="h-4 w-4" />
                      <div>
                        <h4 className="font-medium">Fehler</h4>
                        <p className="text-sm">{passwordError}</p>
                      </div>
                    </Alert>
                  )}
                  
                  <Stack space="md">
                    <Input
                      label="Aktuelles Passwort"
                      type="password"
                      placeholder="Aktuelles Passwort eingeben"
                      value={passwordForm.currentPassword}
                      onChange={(e) => handlePasswordFormChange('currentPassword', e.target.value)}
                      disabled={isChangingPassword}
                      required
                    />
                    <Input
                      label="Neues Passwort"
                      type="password"
                      placeholder="Neues Passwort eingeben"
                      value={passwordForm.newPassword}
                      onChange={(e) => handlePasswordFormChange('newPassword', e.target.value)}
                      disabled={isChangingPassword}
                      helperText="Mindestens 8 Zeichen erforderlich"
                      required
                    />
                    <Input
                      label="Passwort bestätigen"
                      type="password"
                      placeholder="Neues Passwort bestätigen"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => handlePasswordFormChange('confirmPassword', e.target.value)}
                      disabled={isChangingPassword}
                      required
                    />
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className="w-fit"
                      onClick={handleChangePassword}
                      disabled={isChangingPassword}
                    >
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Wird aktualisiert...
                        </>
                      ) : (
                        'Passwort aktualisieren'
                      )}
                    </Button>
                  </Stack>
                </div>

                <Divider />

                <MFASettings />

                <Divider />

                <div>
                  <H3 className="text-base mb-4">Aktive Sitzungen</H3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div>
                        <TextMD className="font-medium">Aktuelle Sitzung</TextMD>
                        <TextMD className="text-muted-foreground text-sm">
                          Chrome auf macOS • Wien, Österreich
                        </TextMD>
                      </div>
                      <Badge variant="default">Aktiv</Badge>
                    </div>
                  </div>
                </div>
              </Stack>
            </Card>
          </Stack>
        );

      case 'privacy':
        return (
          <Stack space="lg">
            <div>
              <H3>Datenschutz & DSGVO</H3>
              <TextMD className="text-muted-foreground mt-1">
                Verwalten Sie Ihre Datenschutz-Einstellungen und DSGVO-Rechte als Mitarbeiter.
              </TextMD>
            </div>
            <GDPRSettings />
          </Stack>
        );

      case 'appearance':
        return (
          <Stack space="lg">
            <div>
              <H3>Erscheinungsbild</H3>
              <TextMD className="text-muted-foreground mt-1">
                Passen Sie das Aussehen der Anwendung an.
              </TextMD>
            </div>

            <Card className="p-6">
              <Stack space="lg">
                <div>
                  <H3 className="text-base mb-4">Design-Theme</H3>
                  <div className="grid grid-cols-3 gap-3">
                    {themeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setTheme(option.value as any)}
                        className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                          theme === option.value 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:bg-accent'
                        }`}
                      >
                        {option.value === 'light' && <Sun className="h-4 w-4" />}
                        {option.value === 'dark' && <Moon className="h-4 w-4" />}
                        {option.value === 'system' && <Monitor className="h-4 w-4" />}
                        <span className="text-sm">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </Stack>
            </Card>
          </Stack>
        );

      case 'language':
        return (
          <Stack space="lg">
            <div>
              <H3>Sprache & Region</H3>
              <TextMD className="text-muted-foreground mt-1">
                Sprach- und Regionseinstellungen anpassen.
              </TextMD>
            </div>

            <Card className="p-6">
              <Stack space="md">
                <Select
                  label="Sprache"
                  options={languageOptions}
                  defaultValue="de"
                />
                <Select
                  label="Zeitzone"
                  options={timezoneOptions}
                  defaultValue="cet"
                />
                <div className="flex justify-end">
                  <Button>Einstellungen speichern</Button>
                </div>
              </Stack>
            </Card>
          </Stack>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <H2>Mein Profil</H2>
        <TextMD className="text-muted-foreground mt-1">
          Verwalten Sie Ihre persönlichen Einstellungen und Präferenzen.
        </TextMD>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tab Navigation */}
        <div className="lg:w-64">
          <Card className="p-2">
            <nav className="space-y-1">
              {profileTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}