'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useConsent } from '@/lib/gdpr/use-consent'

export default function ConsentManagementPanel() {
  const [isLoading, setIsLoading] = useState(false)
  
  const {
    consents,
    userConsents,
    isLoading: consentLoading,
    error,
    grantConsents,
    checkRequiredConsents,
    refreshConsents,
    consentSummary
  } = useConsent({ autoLoadUserConsents: true })

  const handleConsentToggle = async (consentType: string, granted: boolean) => {
    setIsLoading(true)
    try {
      await grantConsents({ [consentType]: granted })
      await refreshConsents()
      alert(granted ? 'Einwilligung erteilt.' : 'Einwilligung widerrufen.')
    } catch (error) {
      console.error('Error updating consent:', error)
      alert('Fehler beim Aktualisieren der Einwilligung.')
    } finally {
      setIsLoading(false)
    }
  }

  const consentCategories = [
    {
      id: 'data_processing',
      title: 'Verarbeitung personenbezogener Daten',
      description: 'Erforderlich für die Antragstellung und -bearbeitung',
      purpose: 'Antragsbearbeitung für Kita-Gutschein und Elterngeld',
      legalBasis: 'Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)',
      required: true,
      category: 'essential'
    },
    {
      id: 'child_data',
      title: 'Verarbeitung von Kinderangaben',
      description: 'Verarbeitung besonderer Kategorien personenbezogener Daten',
      purpose: 'Antragsbearbeitung mit besonderen Kategorien',
      legalBasis: 'Art. 9 Abs. 2 lit. a DSGVO (Ausdrückliche Einwilligung)',
      required: true,
      category: 'essential'
    },
    {
      id: 'document_storage',
      title: 'Dokumentenspeicherung',
      description: 'Speicherung hochgeladener Dokumente für zukünftige Anträge',
      purpose: 'Vereinfachung zukünftiger Antragstellungen',
      legalBasis: 'Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)',
      required: false,
      category: 'convenience'
    },
    {
      id: 'email_notifications',
      title: 'E-Mail-Benachrichtigungen',
      description: 'Informationen über Änderungen und wichtige Mitteilungen',
      purpose: 'Benachrichtigung über Antragsfortschritte',
      legalBasis: 'Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)',
      required: false,
      category: 'communication'
    },
    {
      id: 'analytics',
      title: 'Nutzungsanalyse',
      description: 'Anonyme Analyse zur Verbesserung des Services',
      purpose: 'Service-Optimierung und Fehleranalyse',
      legalBasis: 'Art. 6 Abs. 1 lit. f DSGVO (Berechtigtes Interesse)',
      required: false,
      category: 'analytics'
    }
  ]

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'essential': return 'bg-red-100 text-red-800'
      case 'convenience': return 'bg-blue-100 text-blue-800'
      case 'communication': return 'bg-green-100 text-green-800'
      case 'analytics': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'essential': return 'Erforderlich'
      case 'convenience': return 'Komfort'
      case 'communication': return 'Kommunikation'
      case 'analytics': return 'Analyse'
      default: return 'Sonstige'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-2xl">🔒</span>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Einwilligungsverwaltung</h2>
            <p className="text-sm text-gray-500">Verwalten Sie Ihre Einwilligungen zur Datenverarbeitung</p>
          </div>
        </div>
        <p className="text-gray-600">
          Hier können Sie alle Ihre Einwilligungen zur Datenverarbeitung einsehen und verwalten. 
          Sie haben jederzeit das Recht, erteilte Einwilligungen zu widerrufen.
        </p>
      </div>

      {/* Consent Summary */}
      {consentSummary && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Übersicht Ihrer Einwilligungen</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{consentSummary.totalConsents}</div>
              <div className="text-sm text-gray-600">Gesamt</div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{consentSummary.activeConsents}</div>
              <div className="text-sm text-gray-600">Aktiv</div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{consentSummary.withdrawnConsents}</div>
              <div className="text-sm text-gray-600">Widerrufen</div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{consentSummary.expiredConsents}</div>
              <div className="text-sm text-gray-600">Abgelaufen</div>
            </div>
          </div>
        </div>
      )}

      {/* Consent Categories */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ihre Einwilligungen</h3>
        
        <div className="space-y-4">
          {consentCategories.map((consent) => {
            const isGranted = consents[consent.id] || false
            const userConsent = userConsents.find(uc => uc.consent_type === consent.id)
            
            return (
              <div key={consent.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">{consent.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(consent.category)}`}>
                        {getCategoryLabel(consent.category)}
                      </span>
                      {consent.required && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Erforderlich
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{consent.description}</p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p><strong>Zweck:</strong> {consent.purpose}</p>
                      <p><strong>Rechtsgrundlage:</strong> {consent.legalBasis}</p>
                      {userConsent && (
                        <p><strong>Erteilt am:</strong> {new Date(userConsent.granted_at).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${isGranted ? 'text-green-600' : 'text-red-600'}`}>
                        {isGranted ? 'Erteilt' : 'Nicht erteilt'}
                      </span>
                      <div className="relative inline-block w-10 h-6 bg-gray-200 rounded-full transition-colors duration-200 ease-in-out focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
                        <input
                          type="checkbox"
                          checked={isGranted}
                          onChange={(e) => handleConsentToggle(consent.id, e.target.checked)}
                          disabled={isLoading || (consent.required && isGranted)}
                          className="sr-only"
                        />
                        <div
                          className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${
                            isGranted ? 'translate-x-4 bg-green-500' : 'translate-x-0 bg-white'
                          }`}
                        />
                      </div>
                    </div>
                    
                    {!consent.required && isGranted && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleConsentToggle(consent.id, false)}
                        disabled={isLoading}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        Widerrufen
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Consent History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Einwilligungshistorie</h3>
        
        {userConsents.length === 0 ? (
          <p className="text-gray-500 text-sm">Noch keine Einwilligungen erteilt.</p>
        ) : (
          <div className="space-y-3">
            {userConsents.map((consent) => (
              <div key={consent.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg text-sm">
                <div>
                  <div className="font-medium">{consent.consent_type}</div>
                  <div className="text-gray-500">
                    {consent.purpose}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-medium ${consent.status === 'GRANTED' ? 'text-green-600' : 'text-red-600'}`}>
                    {consent.status === 'GRANTED' ? 'Erteilt' : 'Widerrufen'}
                  </div>
                  <div className="text-gray-500">
                    {new Date(consent.granted_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legal Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">📋 Ihre Rechte</h4>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>Widerruf:</strong> Sie können jede Einwilligung jederzeit widerrufen. 
            Der Widerruf berührt nicht die Rechtmäßigkeit der vor dem Widerruf erfolgten Verarbeitung.
          </p>
          <p>
            <strong>Erforderliche Einwilligungen:</strong> Einige Einwilligungen sind für die Nutzung unserer Services erforderlich 
            und können nicht widerrufen werden, solange Sie die Services nutzen möchten.
          </p>
          <p>
            <strong>Auswirkungen:</strong> Der Widerruf von Einwilligungen kann die Funktionalität 
            bestimmter Services einschränken.
          </p>
        </div>
      </div>
    </div>
  )
} 