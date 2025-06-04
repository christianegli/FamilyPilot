'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useConsent } from '@/lib/gdpr/use-consent'
import DataAccessPanel from '@/components/gdpr/DataAccessPanel'
import DataPortabilityPanel from '@/components/gdpr/DataPortabilityPanel'
import DataRectificationPanel from '@/components/gdpr/DataRectificationPanel'
import DataErasurePanel from '@/components/gdpr/DataErasurePanel'
import ConsentManagementPanel from '@/components/gdpr/ConsentManagementPanel'

type ActivePanel = 'overview' | 'access' | 'portability' | 'rectification' | 'erasure' | 'consent'

export default function UserDashboard() {
  const [activePanel, setActivePanel] = useState<ActivePanel>('overview')
  
  const {
    consents,
    userConsents,
    isLoading,
    error,
    consentSummary,
    refreshConsents
  } = useConsent({ autoLoadUserConsents: true })

  const menuItems = [
    {
      id: 'overview' as ActivePanel,
      title: 'Übersicht',
      icon: '📊',
      description: 'Überblick über Ihre Daten und Rechte'
    },
    {
      id: 'access' as ActivePanel,
      title: 'Datenzugriff',
      icon: '📋',
      description: 'Auskunft über Ihre gespeicherten Daten'
    },
    {
      id: 'portability' as ActivePanel,
      title: 'Datenübertragung',
      icon: '📤',
      description: 'Export Ihrer Daten in maschinenlesbarem Format'
    },
    {
      id: 'rectification' as ActivePanel,
      title: 'Datenberichtigung',
      icon: '✏️',
      description: 'Korrektur falscher oder veralteter Daten'
    },
    {
      id: 'consent' as ActivePanel,
      title: 'Einwilligungen',
      icon: '🔒',
      description: 'Verwaltung Ihrer Einwilligungen'
    },
    {
      id: 'erasure' as ActivePanel,
      title: 'Datenlöschung',
      icon: '🗑️',
      description: 'Antrag auf Löschung Ihrer Daten'
    }
  ]

  const renderContent = () => {
    switch (activePanel) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Willkommen in Ihrem Daten-Dashboard
              </h2>
              <p className="text-gray-600 mb-6">
                Hier können Sie alle Ihre DSGVO-Rechte ausüben und Ihre Daten verwalten. 
                Als betroffene Person haben Sie umfassende Kontrolle über Ihre personenbezogenen Daten.
              </p>

              {/* Rights Overview Cards */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">📋</span>
                    <h3 className="font-medium text-blue-900">Recht auf Auskunft</h3>
                  </div>
                  <p className="text-sm text-blue-800">
                    Erhalten Sie eine vollständige Übersicht über alle Ihre gespeicherten Daten.
                  </p>
                </div>

                <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">📤</span>
                    <h3 className="font-medium text-green-900">Recht auf Datenübertragbarkeit</h3>
                  </div>
                  <p className="text-sm text-green-800">
                    Exportieren Sie Ihre Daten in einem strukturierten, maschinenlesbaren Format.
                  </p>
                </div>

                <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">✏️</span>
                    <h3 className="font-medium text-yellow-900">Recht auf Berichtigung</h3>
                  </div>
                  <p className="text-sm text-yellow-800">
                    Korrigieren Sie unrichtige oder unvollständige personenbezogene Daten.
                  </p>
                </div>

                <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">🔒</span>
                    <h3 className="font-medium text-purple-900">Einwilligungsverwaltung</h3>
                  </div>
                  <p className="text-sm text-purple-800">
                    Verwalten Sie Ihre Einwilligungen zur Datenverarbeitung.
                  </p>
                </div>

                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">🗑️</span>
                    <h3 className="font-medium text-red-900">Recht auf Löschung</h3>
                  </div>
                  <p className="text-sm text-red-800">
                    Beantragen Sie die Löschung Ihrer personenbezogenen Daten.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">📞</span>
                    <h3 className="font-medium text-gray-900">Support & Hilfe</h3>
                  </div>
                  <p className="text-sm text-gray-700">
                    Kontaktieren Sie uns bei Fragen zu Ihren Datenrechten.
                  </p>
                </div>
              </div>

              {/* Consent Summary */}
              {consentSummary && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-3">Ihre aktuellen Einwilligungen</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">
                        {consentSummary.totalConsents}
                      </div>
                      <div className="text-gray-600">Gesamt</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">
                        {consentSummary.activeConsents}
                      </div>
                      <div className="text-gray-600">Aktiv</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-yellow-600">
                        {consentSummary.withdrawnConsents}
                      </div>
                      <div className="text-gray-600">Widerrufen</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-red-600">
                        {consentSummary.expiredConsents}
                      </div>
                      <div className="text-gray-600">Abgelaufen</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Häufige Aktionen</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => setActivePanel('access')}
                  className="flex items-center justify-start space-x-2 h-auto p-4"
                >
                  <span className="text-lg">📋</span>
                  <div className="text-left">
                    <div className="font-medium">Meine Daten anzeigen</div>
                    <div className="text-sm text-gray-500">Vollständige Datenauskunft anfordern</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActivePanel('portability')}
                  className="flex items-center justify-start space-x-2 h-auto p-4"
                >
                  <span className="text-lg">📤</span>
                  <div className="text-left">
                    <div className="font-medium">Daten exportieren</div>
                    <div className="text-sm text-gray-500">Daten in maschinenlesbarem Format</div>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        )

      case 'access':
        return <DataAccessPanel />
      case 'portability':
        return <DataPortabilityPanel />
      case 'rectification':
        return <DataRectificationPanel />
      case 'erasure':
        return <DataErasurePanel />
      case 'consent':
        return <ConsentManagementPanel />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">FP</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Daten-Dashboard</h1>
                <p className="text-sm text-gray-500">Verwalten Sie Ihre DSGVO-Rechte</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/"
                className="text-gray-600 hover:text-blue-600 text-sm flex items-center"
              >
                ← Zurück zur Startseite
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="font-semibold text-gray-900 mb-4">Ihre Rechte</h2>
              <div className="space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActivePanel(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-start space-x-3 ${
                      activePanel === item.id
                        ? 'bg-blue-100 text-blue-900 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <div className="text-sm font-medium">{item.title}</div>
                      <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </nav>

            {/* Legal Notice */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">📋 Rechtliche Hinweise</h3>
              <div className="text-xs text-blue-800 space-y-2">
                <p>
                  Alle Anfragen werden innerhalb von 30 Tagen gemäß DSGVO Art. 12 bearbeitet.
                </p>
                <p>
                  Bei Fragen wenden Sie sich an: 
                  <a 
                    href="mailto:privacy@familienpilot-hamburg.de"
                    className="underline ml-1"
                  >
                    privacy@familienpilot-hamburg.de
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
} 