'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface DataAccessRequest {
  id: string
  requestDate: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  format: 'json' | 'pdf' | 'both'
  completionDate?: string
  downloadLinks?: {
    json?: string
    pdf?: string
  }
}

interface UserDataSummary {
  personalData: {
    applications: number
    documents: number
    consents: number
  }
  lastUpdated: string
  retentionPeriod: string
}

export default function DataAccessPanel() {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'pdf' | 'both'>('both')
  const [verificationEmail, setVerificationEmail] = useState('')
  const [accessRequests, setAccessRequests] = useState<DataAccessRequest[]>([
    {
      id: '1',
      requestDate: '2024-06-01',
      status: 'completed',
      format: 'both',
      completionDate: '2024-06-03',
      downloadLinks: {
        json: '/api/data-export/user-data.json',
        pdf: '/api/data-export/user-data.pdf'
      }
    }
  ])

  // Mock data summary
  const dataSummary: UserDataSummary = {
    personalData: {
      applications: 2,
      documents: 5,
      consents: 8
    },
    lastUpdated: '2024-06-04',
    retentionPeriod: '7 Jahre (gesetzliche Aufbewahrungspflicht)'
  }

  const handleSubmitRequest = async () => {
    if (!verificationEmail.trim()) {
      alert('Bitte geben Sie Ihre E-Mail-Adresse zur Verifizierung ein.')
      return
    }

    setIsLoading(true)
    try {
      // TODO: Implement API call to submit data access request
      const newRequest: DataAccessRequest = {
        id: Date.now().toString(),
        requestDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        format: selectedFormat
      }

      setAccessRequests(prev => [newRequest, ...prev])
      alert('Ihre Datenanfrage wurde erfolgreich eingereicht. Sie erhalten eine Bestätigung per E-Mail.')
      setVerificationEmail('')
    } catch (error) {
      console.error('Error submitting data access request:', error)
      alert('Fehler beim Einreichen der Anfrage. Bitte versuchen Sie es erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: DataAccessRequest['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: DataAccessRequest['status']) => {
    switch (status) {
      case 'pending': return 'Ausstehend'
      case 'processing': return 'In Bearbeitung'
      case 'completed': return 'Abgeschlossen'
      case 'failed': return 'Fehler'
      default: return 'Unbekannt'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-2xl">📋</span>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Recht auf Auskunft</h2>
            <p className="text-sm text-gray-500">DSGVO Artikel 15</p>
          </div>
        </div>
        <p className="text-gray-600 mb-4">
          Sie haben das Recht, eine Bestätigung darüber zu verlangen, ob Sie betreffende 
          personenbezogene Daten verarbeitet werden, und gegebenenfalls Zugang zu diesen 
          personenbezogenen Daten zu erhalten.
        </p>

        {/* Data Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-3">Übersicht Ihrer gespeicherten Daten</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">{dataSummary.personalData.applications}</div>
              <div className="text-blue-800">Anträge</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">{dataSummary.personalData.documents}</div>
              <div className="text-blue-800">Dokumente</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">{dataSummary.personalData.consents}</div>
              <div className="text-blue-800">Einwilligungen</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200 text-xs text-blue-700">
            <p><strong>Letzte Aktualisierung:</strong> {dataSummary.lastUpdated}</p>
            <p><strong>Aufbewahrungsdauer:</strong> {dataSummary.retentionPeriod}</p>
          </div>
        </div>
      </div>

      {/* Request Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Neue Datenanfrage stellen</h3>
        
        <div className="space-y-4">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Format der Datenauskunft
            </label>
            <div className="grid md:grid-cols-3 gap-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="json"
                  checked={selectedFormat === 'json'}
                  onChange={(e) => setSelectedFormat(e.target.value as 'json')}
                  className="text-blue-600"
                />
                <div>
                  <div className="font-medium text-sm">JSON</div>
                  <div className="text-xs text-gray-500">Maschinenlesbar</div>
                </div>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="pdf"
                  checked={selectedFormat === 'pdf'}
                  onChange={(e) => setSelectedFormat(e.target.value as 'pdf')}
                  className="text-blue-600"
                />
                <div>
                  <div className="font-medium text-sm">PDF</div>
                  <div className="text-xs text-gray-500">Menschenlesbar</div>
                </div>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="both"
                  checked={selectedFormat === 'both'}
                  onChange={(e) => setSelectedFormat(e.target.value as 'both')}
                  className="text-blue-600"
                />
                <div>
                  <div className="font-medium text-sm">Beide</div>
                  <div className="text-xs text-gray-500">JSON + PDF</div>
                </div>
              </label>
            </div>
          </div>

          {/* Email Verification */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-Mail-Adresse zur Verifizierung *
            </label>
            <Input
              type="email"
              value={verificationEmail}
              onChange={(e) => setVerificationEmail(e.target.value)}
              placeholder="ihre.email@beispiel.de"
              className="max-w-md"
            />
            <p className="text-xs text-gray-500 mt-1">
              Zur Sicherheit müssen wir Ihre Identität über Ihre registrierte E-Mail-Adresse verifizieren.
            </p>
          </div>

          <Button
            onClick={handleSubmitRequest}
            disabled={isLoading || !verificationEmail.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Wird eingereicht...' : 'Datenanfrage einreichen'}
          </Button>
        </div>
      </div>

      {/* Previous Requests */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bisherige Anfragen</h3>
        
        {accessRequests.length === 0 ? (
          <p className="text-gray-500 text-sm">Sie haben noch keine Datenanfragen gestellt.</p>
        ) : (
          <div className="space-y-4">
            {accessRequests.map((request) => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium">Anfrage vom {request.requestDate}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusText(request.status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Format: {request.format.toUpperCase()}
                  </div>
                </div>
                
                {request.status === 'completed' && request.downloadLinks && (
                  <div className="flex space-x-3 mt-3">
                    {request.downloadLinks.json && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(request.downloadLinks!.json)}
                      >
                        📄 JSON herunterladen
                      </Button>
                    )}
                    {request.downloadLinks.pdf && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(request.downloadLinks!.pdf)}
                      >
                        📋 PDF herunterladen
                      </Button>
                    )}
                  </div>
                )}
                
                {request.completionDate && (
                  <p className="text-xs text-gray-500 mt-2">
                    Abgeschlossen am: {request.completionDate}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legal Information */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">ℹ️ Wichtige Informationen</h4>
        <div className="text-sm text-yellow-800 space-y-2">
          <p>
            <strong>Bearbeitungszeit:</strong> Ihre Anfrage wird innerhalb von 30 Tagen bearbeitet (DSGVO Art. 12).
          </p>
          <p>
            <strong>Kostenlos:</strong> Die erste Anfrage pro Jahr ist kostenlos. Bei wiederholten Anfragen können angemessene Gebühren erhoben werden.
          </p>
          <p>
            <strong>Verifizierung:</strong> Zum Schutz Ihrer Daten müssen wir Ihre Identität verifizieren, bevor wir Auskunft erteilen.
          </p>
        </div>
      </div>
    </div>
  )
} 