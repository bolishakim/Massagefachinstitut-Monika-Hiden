import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { H2 } from '@/components/ui/Typography';

export function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            Datenschutzerklärung für Mitarbeiter
          </CardTitle>
          <p className="text-center text-muted-foreground">
            Interne Datenverarbeitung im Medical Center<br/>
            Zuletzt aktualisiert: {new Date().toLocaleDateString('de-DE')}
          </p>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          
          <H2 className="mt-8">
            1. Verantwortlicher
          </H2>
          <p>
            Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
          </p>
          <address className="not-italic">
            <strong>Medical Center</strong><br />
            Musterstraße 123<br />
            1010 Wien, Österreich<br />
            E-Mail: privacy@medicalcenter.com<br />
            Telefon: +43 1 234 5678
          </address>

          <H2 className="mt-8">
            2. Datenschutzbeauftragter
          </H2>
          <p>
            Unser Datenschutzbeauftragter ist erreichbar unter:<br />
            E-Mail: dpo@medicalcenter.com
          </p>

          <H2 className="mt-8">
            3. Welche personenbezogenen Daten verarbeiten wir?
          </H2>
          <p>
            Als Mitarbeiter des Medical Centers verarbeiten wir folgende Kategorien Ihrer personenbezogenen Daten:
          </p>
          <ul>
            <li><strong>Mitarbeiterdaten:</strong> Name, E-Mail-Adresse, Personalausweis-Nr., Rolle, Abteilung</li>
            <li><strong>Authentifizierungsdaten:</strong> Benutzername, verschlüsselte Passwörter, MFA-Tokens</li>
            <li><strong>Arbeitsbezogene Daten:</strong> Dienstpläne, Arbeitszeiten, Zugangsberechtigungen</li>
            <li><strong>Systemnutzungsdaten:</strong> Anmeldezeiten, IP-Adressen, Browser-Informationen</li>
            <li><strong>Patientenzugriffsprotokolle:</strong> Welche Patientendaten Sie wann eingesehen haben</li>
            <li><strong>Interne Kommunikation:</strong> Systemnachrichten, Benachrichtigungen, Audit-Meldungen</li>
          </ul>

          <H2 className="mt-8">
            4. Rechtsgrundlagen der Verarbeitung
          </H2>
          <p>
            Die Verarbeitung Ihrer personenbezogenen Daten als Mitarbeiter erfolgt auf folgenden Rechtsgrundlagen:
          </p>
          <ul>
            <li><strong>Arbeitsvertrag (Art. 6 Abs. 1 lit. b DSGVO):</strong> Verwaltung des Arbeitsverhältnisses, Systemzugang, Dienstplanung</li>
            <li><strong>Rechtliche Verpflichtung (Art. 6 Abs. 1 lit. c DSGVO):</strong> Audit-Protokolle für Patientendatenzugriffe, Compliance-Dokumentation</li>
            <li><strong>Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO):</strong> IT-Sicherheit, Systemüberwachung, Schutz von Patientendaten</li>
            <li><strong>Einwilligung (Art. 6 Abs. 1 lit. a DSGVO):</strong> Nur für optionale Funktionen wie Benachrichtigungseinstellungen</li>
          </ul>

          <H2 className="mt-8">
            5. Zwecke der Datenverarbeitung
          </H2>
          <p>
            Ihre personenbezogenen Daten werden für folgende arbeitsbezogene Zwecke verarbeitet:
          </p>
          <ul>
            <li>Verwaltung Ihres Mitarbeiterkontos und Systemzugangs</li>
            <li>Authentifizierung und Autorisierung für Systemfunktionen</li>
            <li>Protokollierung des Zugriffs auf Patientendaten (rechtlich vorgeschrieben)</li>
            <li>Gewährleistung der IT-Sicherheit und des Datenschutzes</li>
            <li>Interne Kommunikation und Benachrichtigungen</li>
            <li>Compliance-Überwachung und Audit-Zwecke</li>
            <li>Systemoptimierung und Fehlerbehebung (nur mit Ihrer Einwilligung)</li>
          </ul>

          <H2 className="mt-8">
            6. Aufbewahrungszeiten
          </H2>
          <p>
            Die Speicherdauer Ihrer Daten richtet sich nach arbeitsrechtlichen und gesetzlichen Bestimmungen:
          </p>
          <ul>
            <li><strong>Mitarbeiterdaten:</strong> Dauer des Arbeitsverhältnisses plus 7 Jahre (arbeitsrechtliche Aufbewahrungsfrist)</li>
            <li><strong>Patientenzugriffsprotokolle:</strong> 30 Jahre gemäß österreichischem Gesundheitsrecht</li>
            <li><strong>Audit-Protokolle:</strong> 7 Jahre zum Nachweis der DSGVO-Compliance</li>
            <li><strong>Systemprotokolle:</strong> 90 Tage für IT-Sicherheit, dann automatische Löschung</li>
            <li><strong>Einwilligungen:</strong> 7 Jahre als Nachweis gültiger Einwilligung</li>
          </ul>

          <H2 className="mt-8">
            7. Ihre Rechte
          </H2>
          <p>
            Als betroffene Person haben Sie folgende Rechte:
          </p>
          <ul>
            <li><strong>Recht auf Auskunft (Art. 15 DSGVO):</strong> Sie können Auskunft über Ihre gespeicherten Daten verlangen</li>
            <li><strong>Recht auf Berichtigung (Art. 16 DSGVO):</strong> Sie können die Berichtigung unrichtiger Daten verlangen</li>
            <li><strong>Recht auf Löschung (Art. 17 DSGVO):</strong> Sie können die Löschung Ihrer Daten verlangen</li>
            <li><strong>Recht auf Einschränkung (Art. 18 DSGVO):</strong> Sie können die Einschränkung der Verarbeitung verlangen</li>
            <li><strong>Recht auf Datenübertragbarkeit (Art. 20 DSGVO):</strong> Sie können Ihre Daten in einem maschinenlesbaren Format erhalten</li>
            <li><strong>Widerspruchsrecht (Art. 21 DSGVO):</strong> Sie können der Verarbeitung widersprechen</li>
            <li><strong>Recht auf Widerruf der Einwilligung:</strong> Sie können erteilte Einwilligungen jederzeit widerrufen</li>
          </ul>

          <H2 className="mt-8">
            8. Systemdaten und Cookies
          </H2>
          <p>
            Unsere interne Anwendung verwendet folgende Datenerfassungen:
          </p>
          <ul>
            <li><strong>Notwendige Cookies:</strong> Session-Management, Authentifizierung (Rechtsgrundlage: Arbeitsvertrag)</li>
            <li><strong>Sicherheitsprotokolle:</strong> Login-Versuche, verdächtige Aktivitäten (Rechtsgrundlage: berechtigtes Interesse)</li>
            <li><strong>Systemoptimierung:</strong> Performance-Daten zur Verbesserung der Anwendung (nur mit Ihrer Einwilligung)</li>
            <li><strong>Benachrichtigungseinstellungen:</strong> Persönliche Präferenzen für interne Mitteilungen (nur mit Ihrer Einwilligung)</li>
          </ul>
          <p>
            Sie können optionale Einstellungen jederzeit in Ihren Kontoeinstellungen anpassen.
          </p>

          <H2 className="mt-8">
            9. Externe Dienstleister und Datenübertragungen
          </H2>
          <p>
            Ihre Daten werden grundsätzlich nur innerhalb der EU verarbeitet. 
            Falls externe IT-Dienstleister eingesetzt werden (z.B. Cloud-Hosting, Backup-Services), 
            stellen wir durch entsprechende Verträge und technische Maßnahmen sicher, 
            dass der Schutz Ihrer Daten gewährleistet ist.
          </p>

          <H2 className="mt-8">
            10. Datensicherheit
          </H2>
          <p>
            Wir treffen technische und organisatorische Maßnahmen zum Schutz Ihrer Daten:
          </p>
          <ul>
            <li>Verschlüsselung sensitiver Daten</li>
            <li>Zugriffskontrolle und Benutzerauthentifizierung</li>
            <li>Regelmäßige Sicherheitsupdates</li>
            <li>Protokollierung aller Datenzugriffe</li>
            <li>Schulung unserer Mitarbeiter im Datenschutz</li>
          </ul>

          <H2 className="mt-8">
            11. Beschwerderecht
          </H2>
          <p>
            Sie haben das Recht, eine Beschwerde bei einer Aufsichtsbehörde einzureichen. 
            In Österreich ist dies die Datenschutzbehörde:
          </p>
          <address className="not-italic">
            <strong>Österreichische Datenschutzbehörde</strong><br />
            Barichgasse 40-42<br />
            1030 Wien<br />
            Telefon: +43 1 52 152-0<br />
            E-Mail: dsb@dsb.gv.at<br />
            Website: <a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.dsb.gv.at</a>
          </address>

          <H2 className="mt-8">
            12. Änderungen dieser Datenschutzerklärung
          </H2>
          <p>
            Wir können diese Datenschutzerklärung von Zeit zu Zeit aktualisieren. 
            Wesentliche Änderungen werden wir Ihnen per E-Mail oder durch eine Benachrichtigung auf unserer Website mitteilen. 
            Die aktuelle Version ist immer auf unserer Website verfügbar.
          </p>

          <H2 className="mt-8">
            13. Kontakt
          </H2>
          <p>
            Bei Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte kontaktieren Sie uns unter:
          </p>
          <p>
            <strong>E-Mail:</strong> privacy@medicalcenter.com<br />
            <strong>Datenschutzbeauftragter:</strong> dpo@medicalcenter.com
          </p>

          <div className="mt-12 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Hinweis:</strong> Diese Datenschutzerklärung gilt speziell für Mitarbeiter des Medical Centers 
              und entspricht den Anforderungen der DSGVO sowie dem österreichischen Datenschutzgesetz (DSG) und 
              arbeitsrechtlichen Bestimmungen. Sie wurde zuletzt am {new Date().toLocaleDateString('de-DE')} aktualisiert.
            </p>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}