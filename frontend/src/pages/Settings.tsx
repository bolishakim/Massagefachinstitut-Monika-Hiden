import React, { useState } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  CreditCard, 
  Key,
  Smartphone,
  Mail,
  Lock,
  Sun,
  Moon,
  Monitor
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
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { MFASettings } from '../components/settings/MFASettings';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
  });

  const { theme, setTheme, isDark } = useTheme();
  const { user } = useAuth();

  const settingsTabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'notifications', label: 'Benachrichtigungen', icon: Bell },
    { id: 'security', label: 'Sicherheit', icon: Shield },
    { id: 'appearance', label: 'Erscheinungsbild', icon: Palette },
    { id: 'language', label: 'Sprache & Region', icon: Globe },
    { id: 'billing', label: 'Abrechnung', icon: CreditCard },
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

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <Stack space="lg">
            <div>
              <H3>Profilinformationen</H3>
              <TextMD className="text-muted-foreground mt-1">
                Aktualisieren Sie die Profilinformationen und E-Mail-Adresse Ihres Kontos.
              </TextMD>
            </div>

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
                      JPG, GIF oder PNG. Max. 1MB.
                    </TextMD>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Vorname"
                    defaultValue={user?.firstName || ''}
                    placeholder="Geben Sie Ihren Vornamen ein"
                  />
                  <Input
                    label="Nachname"
                    defaultValue={user?.lastName || ''}
                    placeholder="Geben Sie Ihren Nachnamen ein"
                  />
                </div>

                <Input
                  label="E-Mail-Adresse"
                  type="email"
                  defaultValue={user?.email || ''}
                  placeholder="Geben Sie Ihre E-Mail-Adresse ein"
                />

                <Input
                  label="Biografie"
                  placeholder="Erzählen Sie uns etwas über sich"
                  multiline
                  rows={3}
                />

                <Divider />

                <div className="flex justify-end space-x-2">
                  <Button variant="outline">Abbrechen</Button>
                  <Button variant="default">Änderungen speichern</Button>
                </div>
              </Stack>
            </Card>
          </Stack>
        );

      case 'notifications':
        return (
          <Stack space="lg">
            <div>
              <H3>Benachrichtigungseinstellungen</H3>
              <TextMD className="text-muted-foreground mt-1">
                Wählen Sie, wie Sie über Aktivitäten benachrichtigt werden möchten.
              </TextMD>
            </div>

            <Card className="p-6">
              <Stack space="md">
                <div>
                  <H3 className="text-base">E-Mail-Benachrichtigungen</H3>
                  <Stack space="sm" className="mt-4">
                    <Checkbox
                      label="Account updates"
                      description="Get notified about account security and privacy updates"
                      checked={notifications.email}
                      onChange={(e) => setNotifications({...notifications, email: e.target.checked})}
                    />
                    <Checkbox
                      label="Marketing emails"
                      description="Receive emails about new products, features, and company news"
                    />
                    <Checkbox
                      label="Weekly summary"
                      description="Get a weekly summary of your activity and performance"
                    />
                  </Stack>
                </div>

                <Divider />

                <div>
                  <H3 className="text-base">Push Notifications</H3>
                  <Stack space="sm" className="mt-4">
                    <Checkbox
                      label="Real-time alerts"
                      description="Get notified about important events as they happen"
                      checked={notifications.push}
                      onChange={(e) => setNotifications({...notifications, push: e.target.checked})}
                    />
                    <Checkbox
                      label="Daily digest"
                      description="Receive a summary of your daily activity"
                    />
                  </Stack>
                </div>

                <Divider />

                <div className="flex justify-end space-x-2">
                  <Button variant="outline">Reset to Default</Button>
                  <Button variant="default">Save Preferences</Button>
                </div>
              </Stack>
            </Card>
          </Stack>
        );

      case 'security':
        return (
          <Stack space="lg">
            <div>
              <H3>Security Settings</H3>
              <TextMD className="text-muted-foreground mt-1">
                Manage your account security and authentication methods.
              </TextMD>
            </div>

            <Card className="p-6">
              <Stack space="lg">
                <div>
                  <H3 className="text-base mb-4">Password</H3>
                  <Stack space="md">
                    <Input
                      label="Current Password"
                      type="password"
                      placeholder="Enter current password"
                    />
                    <Input
                      label="New Password"
                      type="password"
                      placeholder="Enter new password"
                    />
                    <Input
                      label="Confirm Password"
                      type="password"
                      placeholder="Confirm new password"
                    />
                    <Button variant="default" size="sm" className="w-fit">
                      Update Password
                    </Button>
                  </Stack>
                </div>

                <Divider />

                <MFASettings />

                <Divider />

                <div>
                  <H3 className="text-base mb-4">Login Sessions</H3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div>
                        <TextMD className="font-medium">Current Session</TextMD>
                        <TextMD className="text-muted-foreground text-sm">
                          Chrome on macOS • San Francisco, CA
                        </TextMD>
                      </div>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div>
                        <TextMD className="font-medium">Mobile Device</TextMD>
                        <TextMD className="text-muted-foreground text-sm">
                          Safari on iOS • 2 hours ago
                        </TextMD>
                      </div>
                      <Button variant="outline" size="sm">Revoke</Button>
                    </div>
                  </div>
                </div>
              </Stack>
            </Card>
          </Stack>
        );

      case 'appearance':
        return (
          <Stack space="lg">
            <div>
              <H3>Appearance</H3>
              <TextMD className="text-muted-foreground mt-1">
                Customize how the app looks and feels.
              </TextMD>
            </div>

            <Card className="p-6">
              <Stack space="lg">
                <div>
                  <H3 className="text-base mb-4">Theme</H3>
                  <div className="space-y-3">
                    {themeOptions.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center justify-between p-4 border border-border rounded-lg cursor-pointer hover:bg-accent"
                        onClick={() => setTheme(option.value as any)}
                      >
                        <div className="flex items-center space-x-3">
                          {option.value === 'light' && <Sun className="h-5 w-5 text-muted-foreground" />}
                          {option.value === 'dark' && <Moon className="h-5 w-5 text-muted-foreground" />}
                          {option.value === 'system' && <Monitor className="h-5 w-5 text-muted-foreground" />}
                          <div>
                            <TextMD className="font-medium">{option.label}</TextMD>
                            <TextMD className="text-muted-foreground text-sm">
                              {option.value === 'light' && 'Always use light theme'}
                              {option.value === 'dark' && 'Always use dark theme'}
                              {option.value === 'system' && 'Follow system preference'}
                            </TextMD>
                          </div>
                        </div>
                        {theme === option.value && (
                          <Badge variant="default">Active</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Divider />

                <div>
                  <H3 className="text-base mb-4">Layout</H3>
                  <Stack space="sm">
                    <Checkbox
                      label="Compact mode"
                      description="Use smaller spacing and font sizes"
                    />
                    <Checkbox
                      label="Show sidebar by default"
                      description="Keep the sidebar open on large screens"
                      checked={true}
                    />
                  </Stack>
                </div>
              </Stack>
            </Card>
          </Stack>
        );

      case 'language':
        return (
          <Stack space="lg">
            <div>
              <H3>Language & Region</H3>
              <TextMD className="text-muted-foreground mt-1">
                Set your preferred language and regional settings.
              </TextMD>
            </div>

            <Card className="p-6">
              <Stack space="md">
                <Select
                  options={languageOptions}
                  defaultValue="en"
                  label="Language"
                />
                <Select
                  options={timezoneOptions}
                  defaultValue="utc"
                  label="Timezone"
                />
                <div className="flex justify-end">
                  <Button variant="default">Save Changes</Button>
                </div>
              </Stack>
            </Card>
          </Stack>
        );

      case 'billing':
        return (
          <Stack space="lg">
            <div>
              <H3>Billing & Subscription</H3>
              <TextMD className="text-muted-foreground mt-1">
                Manage your billing information and subscription.
              </TextMD>
            </div>

            <Card className="p-6">
              <Stack space="lg">
                <div>
                  <H3 className="text-base mb-4">Current Plan</H3>
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <TextMD className="font-medium">Pro Plan</TextMD>
                        <TextMD className="text-muted-foreground text-sm">
                          $29/month • Billed monthly
                        </TextMD>
                      </div>
                      <Badge variant="default">Active</Badge>
                    </div>
                  </div>
                </div>

                <Divider />

                <div>
                  <H3 className="text-base mb-4">Payment Method</H3>
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <TextMD className="font-medium">•••• •••• •••• 4242</TextMD>
                        <TextMD className="text-muted-foreground text-sm">
                          Expires 12/25
                        </TextMD>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="mt-2">
                    Update Payment Method
                  </Button>
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
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <H2>Settings</H2>
        <TextMD className="text-muted-foreground mt-2">
          Manage your account settings and preferences.
        </TextMD>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-2">
            <nav className="space-y-1">
              {settingsTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}