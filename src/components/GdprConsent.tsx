'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface ConsentOption {
  id: string
  title: string
  description: string
  required: boolean
  legalBasis: string
  purpose: string
}

interface GdprConsentProps {
  onConsentChange: (consents: Record<string, boolean>) => void
  applicationContext: 'kita' | 'elterngeld'
}

export default function GdprConsent({ onConsentChange, applicationContext }: GdprConsentProps) {
  const [consents, setConsents] = useState<Record<string, boolean>>({})
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({})

  const getConsentOptions = (): ConsentOption[] => {
    const baseOptions: ConsentOption[] = [
      {
        id: 'data_processing',
        title: 'Verarbeitung Ihrer persönlichen Daten',
        description: 'Verarbeitung Ihrer persönlichen Daten für die Bearbeitung Ihres Antrags',
        required: true,
        legalBasis: 'Berechtigtes Interesse (öffentliche Aufgabenerfüllung) + Einwilligung',
        purpose: 'Antragstellung und -bearbeitung für Hamburg Familienservices'
      },
      {
        id: 'child_data',
        title: 'Verarbeitung von Kinderdaten',
        description: 'Verarbeitung der Daten Ihres Kindes (besondere Kategorie personenbezogener Daten)',
        required: true,
        legalBasis: 'Ausdrückliche Einwilligung (Art. 9 DSGVO)',
        purpose: 'Identifikation und Berechtigung für Betreuungs-/Unterstützungsleistungen'
      },
      {
        id: 'financial_data',
        title: 'Verarbeitung von Einkommensdaten',
        description: 'Verarbeitung Ihrer Einkommens- und Beschäftigungsdaten für Berechnungen',
        required: true,
        legalBasis: 'Berechtigtes Interesse + Einwilligung',
        purpose: applicationContext === 'kita' 
          ? 'Berechnung des Elternbeitrags' 
          : 'Berechnung der Elterngeld-Höhe'
      }
    ]

    const optionalOptions: ConsentOption[] = [
      {
        id: 'document_vault',
        title: 'Dokumentenspeicherung',
        description: 'Speicherung Ihrer Dokumente für zukünftige Anträge (optional)',
        required: false,
        legalBasis: 'Einwilligung',
        purpose: 'Vereinfachung zukünftiger Antragsstellungen'
      },
      {
        id: 'email_notifications',
        title: 'E-Mail-Benachrichtigungen',
        description: 'Versendung von Status-Updates und Erinnerungen per E-Mail (optional)',
        required: false,
        legalBasis: 'Einwilligung',
        purpose: 'Information über Antragsfortschritt und wichtige Fristen'
      },
      {
        id: 'analytics',
        title: 'Anonyme Nutzungsstatistiken',
        description: 'Erhebung anonymisierter Daten zur Verbesserung des Services (optional)',
        required: false,
        legalBasis: 'Einwilligung',
        purpose: 'Service-Verbesserung und Benutzerfreundlichkeit'
      }
    ]

    return [...baseOptions, ...optionalOptions]
  }

  const consentOptions = getConsentOptions()

  const handleConsentChange = (optionId: string, checked: boolean) => {
    const newConsents = {
      ...consents,
      [optionId]: checked
    }
    setConsents(newConsents)
    onConsentChange(newConsents)
  }

  const toggleDetails = (optionId: string) => {
    setShowDetails(prev => ({
      ...prev,
      [optionId]: !prev[optionId]
    }))
  }

  const allRequiredConsentsGiven = () => {
    return consentOptions
      .filter(option => option.required)
      .every(option => consents[option.id])
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
        </svg>
        <h3 className="text-lg font-semibold text-blue-900">
          Datenschutz und Einwilligungen
        </h3>
      </div>

      <p className="text-sm text-blue-800 mb-6">
        Gemäß der DSGVO benötigen wir Ihre Einwilligung für die Verarbeitung Ihrer personenbezogenen Daten. 
        Sie können Ihre Einwilligung jederzeit widerrufen.
      </p>

      <div className="space-y-4">
        {consentOptions.map((option) => (
          <div key={option.id} className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id={option.id}
                checked={consents[option.id] || false}
                onChange={(e) => handleConsentChange(option.id, e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                required={option.required}
              />
              <div className="flex-1">
                <label htmlFor={option.id} className="flex items-center cursor-pointer">
                  <span className="text-sm font-medium text-gray-900">
                    {option.title}
                    {option.required && <span className="text-red-500 ml-1">*</span>}
                  </span>
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  {option.description}
                </p>
                
                <button
                  type="button"
                  onClick={() => toggleDetails(option.id)}
                  className="text-xs text-blue-600 hover:text-blue-800 mt-2 flex items-center"
                >
                  {showDetails[option.id] ? 'Weniger anzeigen' : 'Details anzeigen'}
                  <svg className={`w-3 h-3 ml-1 transition-transform ${showDetails[option.id] ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </button>

                {showDetails[option.id] && (
                  <div className="mt-3 p-3 bg-gray-50 rounded border text-xs">
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Rechtsgrundlage:</span>
                        <span className="ml-1">{option.legalBasis}</span>
                      </div>
                      <div>
                        <span className="font-medium">Zweck:</span>
                        <span className="ml-1">{option.purpose}</span>
                      </div>
                      <div>
                        <span className="font-medium">Widerruf:</span>
                        <span className="ml-1">
                          {option.required 
                            ? 'Erforderlich für die Antragsbearbeitung' 
                            : 'Jederzeit in den Kontoeinstellungen widerrufbar'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!allRequiredConsentsGiven() && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            ⚠️ Bitte stimmen Sie allen erforderlichen Einwilligungen zu, um fortzufahren.
          </p>
        </div>
      )}

      <div className="mt-6 text-xs text-gray-600">
        <p className="mb-2">
          <strong>Ihre Rechte:</strong> Sie haben das Recht auf Auskunft, Berichtigung, Löschung, 
          Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch.
        </p>
        <p>
          <strong>Datenschutzbeauftragte:</strong> Bei Fragen wenden Sie sich an unseren 
          Datenschutzbeauftragten unter privacy@familienpilot-hamburg.de
        </p>
      </div>
    </div>
  )
} 