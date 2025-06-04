'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ExportRequest {
  id: string
  requestDate: string
  status: 'preparing' | 'ready' | 'expired'
  format: 'json' | 'csv' | 'xml'
  includeDocuments: boolean
  expiryDate?: string
  downloadLink?: string
  fileSize?: string
}

export default function DataPortabilityPanel() {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'csv' | 'xml'>('json')
  const [includeDocuments, setIncludeDocuments] = useState(false)
  const [destinationEmail, setDestinationEmail] = useState('')
  const [exportRequests, setExportRequests] = useState<ExportRequest[]>([
    {
      id: '1',
      requestDate: '2024-06-01',
      status: 'ready',
      format: 'json',
      includeDocuments: false,
      expiryDate: '2024-06-08',
      downloadLink: '/api/export/user-data-export.json',
      fileSize: '2.3 MB'
    }
  ])

  const dataCategories = [
    {
      id: 'personal',
      name: 'Persönliche Daten',
      description: 'Name, Adresse, Kontaktdaten',
      included: true,
      required: true
    },
    {
      id: 'applications',
      name: 'Anträge',
      description: 'Kita-Gutschein und Elterngeld Anträge',
      included: true,
      required: true
    },
    {
      id: 'consents',
      name: 'Einwilligungen',
      description: 'Ihre Einwilligungshistorie',
      included: true,
      required: false
    },
    {
      id: 'communications',
      name: 'Kommunikation',
      description: 'E-Mail-Verlauf und Benachrichtigungen',
      included: false,
      required: false
    }
  ]

  const handleSubmitExport = async () => {
    if (!destinationEmail.trim()) {
      alert('Bitte geben Sie eine E-Mail-Adresse für die Zustellung ein.')
      return
    }

    setIsLoading(true)
    try {
      // TODO: Implement API call to request data export
      const newRequest: ExportRequest = {
        id: Date.now().toString(),
        requestDate: new Date().toISOString().split('T')[0],
        status: 'preparing',
        format: selectedFormat,
        includeDocuments,
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }

      setExportRequests(prev => [newRequest, ...prev])
      alert('Ihr Datenexport wurde erfolgreich angefordert. Sie erhalten eine E-Mail, sobald der Download bereit ist.')
      setDestinationEmail('')
    } catch (error) {
      console.error('Error submitting export request:', error)
      alert('Fehler beim Anfordern des Exports. Bitte versuchen Sie es erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: ExportRequest['status']) => {
    switch (status) {
      case 'preparing': return 'bg-blue-100 text-blue-800'
      case 'ready': return 'bg-green-100 text-green-800'
      case 'expired': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: ExportRequest['status']) => {
    switch (status) {
      case 'preparing': return 'Wird vorbereitet'
      case 'ready': return 'Zum Download bereit'
      case 'expired': return 'Abgelaufen'
      default: return 'Unbekannt'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-2xl">📤</span>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Recht auf Datenübertragbarkeit</h2>
            <p className="text-sm text-gray-500">DSGVO Artikel 20</p>
          </div>
        </div>
        <p className="text-gray-600 mb-4">
          Sie haben das Recht, die Sie betreffenden personenbezogenen Daten in einem strukturierten, 
          gängigen und maschinenlesbaren Format zu erhalten und diese Daten einem anderen 
          Verantwortlichen zu übermitteln.
        </p>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-900 mb-2">📋 Was wird exportiert?</h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Alle Ihre persönlichen Daten in strukturiertem Format</li>
            <li>• Antrags- und Formulardaten</li>
            <li>• Einwilligungshistorie</li>
            <li>• Optional: Hochgeladene Dokumente</li>
          </ul>
        </div>
      </div>

      {/* Export Configuration */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Neuen Datenexport konfigurieren</h3>
        
        <div className="space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export-Format
            </label>
            <div className="grid md:grid-cols-3 gap-3">
              <label className="flex items-center space-x-2 cursor-pointer border border-gray-200 rounded-lg p-3">
                <input
                  type="radio"
                  value="json"
                  checked={selectedFormat === 'json'}
                  onChange={(e) => setSelectedFormat(e.target.value as 'json')}
                  className="text-blue-600"
                />
                <div>
                  <div className="font-medium text-sm">JSON</div>
                  <div className="text-xs text-gray-500">Optimal für APIs und Entwickler</div>
                </div>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer border border-gray-200 rounded-lg p-3">
                <input
                  type="radio"
                  value="csv"
                  checked={selectedFormat === 'csv'}
                  onChange={(e) => setSelectedFormat(e.target.value as 'csv')}
                  className="text-blue-600"
                />
                <div>
                  <div className="font-medium text-sm">CSV</div>
                  <div className="text-xs text-gray-500">Für Excel und Tabellenkalkulationen</div>
                </div>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer border border-gray-200 rounded-lg p-3">
                <input
                  type="radio"
                  value="xml"
                  checked={selectedFormat === 'xml'}
                  onChange={(e) => setSelectedFormat(e.target.value as 'xml')}
                  className="text-blue-600"
                />
                <div>
                  <div className="font-medium text-sm">XML</div>
                  <div className="text-xs text-gray-500">Strukturiert und standardisiert</div>
                </div>
              </label>
            </div>
          </div>

          {/* Data Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Datenkategorien
            </label>
            <div className="space-y-3">
              {dataCategories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={category.included}
                      disabled={category.required}
                      className="text-blue-600"
                    />
                    <div>
                      <div className="font-medium text-sm">{category.name}</div>
                      <div className="text-xs text-gray-500">{category.description}</div>
                    </div>
                  </div>
                  {category.required && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Erforderlich
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Include Documents */}
          <div className="border border-gray-200 rounded-lg p-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeDocuments}
                onChange={(e) => setIncludeDocuments(e.target.checked)}
                className="text-blue-600"
              />
              <div>
                <div className="font-medium text-sm">Dokumente einschließen</div>
                <div className="text-xs text-gray-500">
                  Hochgeladene Dokumente (PDFs, Bilder) in den Export einbeziehen. 
                  Dies kann die Dateigröße erheblich erhöhen.
                </div>
              </div>
            </label>
          </div>

          {/* Destination Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-Mail-Adresse für Download-Link *
            </label>
            <Input
              type="email"
              value={destinationEmail}
              onChange={(e) => setDestinationEmail(e.target.value)}
              placeholder="ihre.email@beispiel.de"
              className="max-w-md"
            />
            <p className="text-xs text-gray-500 mt-1">
              Wir senden Ihnen den Download-Link an diese E-Mail-Adresse. Der Link ist 7 Tage gültig.
            </p>
          </div>

          <Button
            onClick={handleSubmitExport}
            disabled={isLoading || !destinationEmail.trim()}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? 'Wird vorbereitet...' : 'Datenexport anfordern'}
          </Button>
        </div>
      </div>

      {/* Export History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export-Verlauf</h3>
        
        {exportRequests.length === 0 ? (
          <p className="text-gray-500 text-sm">Sie haben noch keine Datenexporte angefordert.</p>
        ) : (
          <div className="space-y-4">
            {exportRequests.map((request) => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium">Export vom {request.requestDate}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusText(request.status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {request.format.toUpperCase()} 
                    {request.includeDocuments && ' + Dokumente'}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 space-y-1">
                    {request.fileSize && <p>Dateigröße: {request.fileSize}</p>}
                    {request.expiryDate && (
                      <p>Gültig bis: {request.expiryDate}</p>
                    )}
                  </div>
                  
                  {request.status === 'ready' && request.downloadLink && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(request.downloadLink)}
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      📥 Herunterladen
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legal Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">ℹ️ Wichtige Hinweise</h4>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>Gültigkeit:</strong> Download-Links sind 7 Tage gültig. Danach werden die Dateien automatisch gelöscht.
          </p>
          <p>
            <strong>Format:</strong> Alle Daten werden in standardisierten, maschinenlesbaren Formaten bereitgestellt.
          </p>
          <p>
            <strong>Sicherheit:</strong> Downloads sind verschlüsselt und nur über den personalisierten Link zugänglich.
          </p>
          <p>
            <strong>Verwendung:</strong> Die exportierten Daten können Sie zur Übertragung an andere Dienste verwenden.
          </p>
        </div>
      </div>
    </div>
  )
} 