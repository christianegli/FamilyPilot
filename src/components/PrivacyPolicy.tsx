'use client'

import { useState } from 'react'

interface PrivacyPolicyProps {
  isModal?: boolean
  onClose?: () => void
}

export default function PrivacyPolicy({ isModal = false, onClose }: PrivacyPolicyProps) {
  const [activeSection, setActiveSection] = useState<string>('overview')

  const sections = [
    { id: 'overview', title: 'Überblick', icon: '📋' },
    { id: 'data-collection', title: 'Datenerhebung', icon: '📊' },
    { id: 'legal-basis', title: 'Rechtsgrundlagen', icon: '⚖️' },
    { id: 'data-sharing', title: 'Datenweitergabe', icon: '🔄' },
    { id: 'your-rights', title: 'Ihre Rechte', icon: '👤' },
    { id: 'security', title: 'Datensicherheit', icon: '🔒' },
    { id: 'retention', title: 'Aufbewahrung', icon: '📅' },
    { id: 'contact', title: 'Kontakt', icon: '📧' }
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Datenschutzerklärung - Überblick</h3>
            <p className="text-gray-700">
              FamilienPilot Hamburg verarbeitet Ihre personenbezogenen Daten gemäß der Datenschutz-Grundverordnung (DSGVO) 
              und dem Bundesdatenschutzgesetz (BDSG). Diese Datenschutzerklärung informiert Sie über Art, Umfang und Zweck 
              der Verarbeitung personenbezogener Daten.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Wichtige Informationen</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Datenverarbeitung erfolgt ausschließlich in der EU (Frankfurt, Deutschland)</li>
                <li>• Alle Daten werden verschlüsselt übertragen und gespeichert</li>
                <li>• Sie können Ihre Einwilligungen jederzeit widerrufen</li>
                <li>• Ihre Rechte als betroffene Person bleiben vollständig gewahrt</li>
              </ul>
            </div>
          </div>
        )

      case 'data-collection':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Datenerhebung und -verarbeitung</h3>
            
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">🏠 Kita-Gutschein Antrag</h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <p><strong>Personenbezogene Daten:</strong> Name, Geburtsdatum, Adresse, Kontaktdaten</p>
                  <p><strong>Kinderdaten:</strong> Name, Geburtsdatum, Geburtsort (besondere Kategorie)</p>
                  <p><strong>Finanzdaten:</strong> Einkommen, Arbeitgeber, Beschäftigungsart</p>
                  <p><strong>Zweck:</strong> Bearbeitung des Kita-Gutschein-Antrags und Elternbeitrag-Berechnung</p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">👶 Elterngeld Antrag</h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <p><strong>Personenbezogene Daten:</strong> Name, Geburtsdatum, Adresse, Kontaktdaten</p>
                  <p><strong>Kinderdaten:</strong> Name, Geburtsdatum, Geburtsort (besondere Kategorie)</p>
                  <p><strong>Finanzdaten:</strong> Jahreseinkommen, Elternzeit-Planung, Partnerschaftsinformationen</p>
                  <p><strong>Zweck:</strong> Bearbeitung des Elterngeld-Antrags und Leistungsberechnung</p>
                </div>
              </div>
            </div>
          </div>
        )

      case 'legal-basis':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Rechtsgrundlagen der Verarbeitung</h3>
            
            <div className="space-y-3">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium text-gray-900">Art. 6 Abs. 1 lit. e DSGVO - Öffentliche Aufgabe</h4>
                <p className="text-sm text-gray-700 mt-1">
                  Verarbeitung zur Erfüllung einer Aufgabe, die im öffentlichen Interesse liegt 
                  (Bearbeitung von Anträgen für staatliche Leistungen)
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-medium text-gray-900">Art. 6 Abs. 1 lit. a DSGVO - Einwilligung</h4>
                <p className="text-sm text-gray-700 mt-1">
                  Einwilligung für optionale Services wie Dokumentenspeicherung, 
                  E-Mail-Benachrichtigungen und Service-Verbesserungen
                </p>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-medium text-gray-900">Art. 9 Abs. 2 lit. a DSGVO - Besondere Kategorien</h4>
                <p className="text-sm text-gray-700 mt-1">
                  Ausdrückliche Einwilligung für die Verarbeitung von Kinderdaten 
                  (besondere Kategorie personenbezogener Daten)
                </p>
              </div>
            </div>
          </div>
        )

      case 'data-sharing':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Datenweitergabe und Empfänger</h3>
            
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">🏛️ Behörden und Ämter</h4>
                <div className="text-sm text-yellow-800 space-y-1">
                  <p>• <strong>Jugendämter Hamburg:</strong> Kita-Gutschein Anträge</p>
                  <p>• <strong>Bezirksämter Hamburg:</strong> Elterngeld Anträge</p>
                  <p>• <strong>Rechtliche Grundlage:</strong> Antragstellung und Leistungsgewährung</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">🔧 Auftragsverarbeiter</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• <strong>Supabase:</strong> Datenbank und Backend-Services (EU Frankfurt)</p>
                  <p>• <strong>Rechtliche Grundlage:</strong> Auftragsverarbeitungsvertrag (AVV)</p>
                  <p>• <strong>Zertifizierungen:</strong> SOC 2, ISO 27001</p>
                </div>
              </div>
            </div>
          </div>
        )

      case 'your-rights':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Ihre Rechte als betroffene Person</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">📋 Recht auf Auskunft (Art. 15)</h4>
                <p className="text-sm text-gray-700">
                  Sie haben das Recht, Auskunft über die von uns verarbeiteten personenbezogenen Daten zu erhalten.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">✏️ Recht auf Berichtigung (Art. 16)</h4>
                <p className="text-sm text-gray-700">
                  Sie können die Berichtigung unrichtiger oder unvollständiger Daten verlangen.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">🗑️ Recht auf Löschung (Art. 17)</h4>
                <p className="text-sm text-gray-700">
                  Sie können die Löschung Ihrer Daten verlangen, soweit keine gesetzlichen Aufbewahrungsfristen bestehen.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">📤 Recht auf Datenübertragbarkeit (Art. 20)</h4>
                <p className="text-sm text-gray-700">
                  Sie haben das Recht, Ihre Daten in einem strukturierten, maschinenlesbaren Format zu erhalten.
                </p>
              </div>
            </div>
          </div>
        )

      case 'security':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Technische und organisatorische Maßnahmen</h3>
            
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">🔐 Technische Sicherheit</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• AES-256 Verschlüsselung der Datenbank</li>
                  <li>• TLS 1.3 Verschlüsselung aller Datenübertragungen</li>
                  <li>• Multi-Faktor-Authentifizierung</li>
                  <li>• Automatische Sicherheits-Updates</li>
                  <li>• Regelmäßige Sicherheitsaudits</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">👥 Organisatorische Maßnahmen</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Schulung aller Mitarbeiter zu Datenschutz</li>
                  <li>• Zugriffskontrolle nach dem Need-to-know-Prinzip</li>
                  <li>• Datenschutz-Folgenabschätzung (DSFA)</li>
                  <li>• Regelmäßige Compliance-Überprüfungen</li>
                  <li>• Incident-Response-Verfahren</li>
                </ul>
              </div>
            </div>
          </div>
        )

      case 'retention':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Speicherdauer und Löschung</h3>
            
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">📅 Aufbewahrungsfristen</h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <p><strong>Antragsadaten:</strong> 7 Jahre (gesetzliche Aufbewahrungspflicht für Behördenanträge)</p>
                  <p><strong>Audit-Logs:</strong> 3 Jahre (Compliance-Nachweis)</p>
                  <p><strong>Einwilligungen:</strong> 7 Jahre (Nachweis der Rechtmäßigkeit)</p>
                  <p><strong>Session-Daten:</strong> 24 Stunden (technische Notwendigkeit)</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-900 mb-2">🗑️ Automatische Löschung</h4>
                <p className="text-sm text-red-800">
                  Daten werden automatisch gelöscht, sobald der Zweck der Verarbeitung entfällt 
                  und keine gesetzlichen Aufbewahrungsfristen mehr bestehen. 
                  Die Löschung erfolgt täglich um 2:00 Uhr durch automatisierte Prozesse.
                </p>
              </div>
            </div>
          </div>
        )

      case 'contact':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Kontakt und Beschwerden</h3>
            
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">📧 Datenschutzbeauftragte</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <p><strong>E-Mail:</strong> privacy@familienpilot-hamburg.de</p>
                  <p><strong>Telefon:</strong> +49 40 123 456 789</p>
                  <p><strong>Postanschrift:</strong> FamilienPilot Hamburg, Datenschutz, Musterstraße 123, 20095 Hamburg</p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">🏛️ Aufsichtsbehörde</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <p><strong>Behörde:</strong> Der Hamburgische Beauftragte für Datenschutz und Informationsfreiheit</p>
                  <p><strong>Adresse:</strong> Ludwig-Erhard-Str. 22, 20459 Hamburg</p>
                  <p><strong>E-Mail:</strong> mailbox@datenschutz.hamburg.de</p>
                  <p><strong>Website:</strong> https://datenschutz.hamburg.de</p>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const Component = isModal ? 'div' : 'div'
  const containerClasses = isModal 
    ? "fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
    : "max-w-4xl mx-auto px-4 py-8"

  return (
    <Component className={containerClasses}>
      <div className={`bg-white rounded-lg shadow-lg ${isModal ? 'max-w-4xl w-full max-h-[90vh] overflow-hidden' : ''}`}>
        {isModal && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Datenschutzerklärung</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className={`flex ${isModal ? 'h-[calc(90vh-80px)]' : 'min-h-screen'}`}>
          {/* Sidebar */}
          <div className="w-1/3 bg-gray-50 border-r border-gray-200 p-6">
            <nav className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 ${
                    activeSection === section.id
                      ? 'bg-blue-100 text-blue-900 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{section.icon}</span>
                  <span className="text-sm">{section.title}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    </Component>
  )
} 