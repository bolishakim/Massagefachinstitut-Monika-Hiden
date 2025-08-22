import React from 'react';
import { Settings, Stethoscope, Building2, Users, Shield, Clock } from 'lucide-react';
import { H2, H3, TextMD } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';

export function SettingsPage() {
  const { user } = useAuth();

  const adminTools = [
    {
      id: 'security',
      title: 'Systemsicherheit',
      description: 'Sicherheitseinstellungen und Systemkonfiguration',
      icon: Shield,
      href: '/settings/security',
      requiredRoles: ['ADMIN'],
    },
    {
      id: 'services',
      title: 'Dienstleistungen verwalten',
      description: 'Behandlungsarten und Serviceangebote konfigurieren',
      icon: Stethoscope,
      href: '/settings/services',
      requiredRoles: ['ADMIN', 'MODERATOR'],
    },
    {
      id: 'rooms',
      title: 'Räume verwalten',
      description: 'Behandlungsräume und deren Verfügbarkeit verwalten',
      icon: Building2,
      href: '/settings/rooms',
      requiredRoles: ['ADMIN', 'MODERATOR'],
    },
    {
      id: 'users',
      title: 'Benutzerverwaltung',
      description: 'Mitarbeiterkonten und Berechtigungen verwalten',
      icon: Users,
      href: '/settings/users',
      requiredRoles: ['ADMIN'],
    },
    {
      id: 'staff-schedules',
      title: 'Mitarbeiter Arbeitszeiten',
      description: 'Arbeitszeiten und Schichtpläne der Mitarbeiter verwalten',
      icon: Clock,
      href: '/settings/staff-schedules',
      requiredRoles: ['ADMIN'],
    },
  ];

  const availableTools = adminTools.filter(tool => 
    !tool.requiredRoles || tool.requiredRoles.includes(user?.role || 'USER')
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <H2>Systemverwaltung</H2>
        <TextMD className="text-muted-foreground mt-2">
          Administrative Werkzeuge zur Verwaltung des Medizinzentrums.
        </TextMD>
      </div>

      {availableTools.length === 0 ? (
        <Card className="p-8 text-center">
          <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <H3>Keine Administrationsrechte</H3>
          <TextMD className="text-muted-foreground mt-2">
            Sie haben keine Berechtigung für Systemverwaltungsaufgaben.
            Kontaktieren Sie Ihren Administrator für weitere Informationen.
          </TextMD>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card key={tool.id} className="p-6 hover:shadow-lg transition-shadow">
                <a href={tool.href} className="block">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <H3 className="text-base mb-2">{tool.title}</H3>
                      <TextMD className="text-muted-foreground text-sm">
                        {tool.description}
                      </TextMD>
                    </div>
                  </div>
                </a>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}