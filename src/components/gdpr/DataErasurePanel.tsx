'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface ErasureRequest {
  id: string
  requestDate: string
  status: 'pending' | 'approved' | 'completed' | 'rejected'
  reason: string
  scope: 'partial' | 'complete'
  dataCategories: string[]
  completionDate?: string
  rejectionReason?: string
}

export default function DataErasurePanel() {
  const [isLoading, setIsLoading] = useState(false)
  const [erasureReason, setErasureReason] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [confirmationText, setConfirmationText] = useState('')
  const [erasureRequests, setErasureRequests] = useState<ErasureRequest[]>([])

  const erasureReasons = [
    {
      id: 'consent_withdrawn',
      title: 'Einwilligung widerrufen',
      description: 'Ich widerrufe meine Einwilligung zur Datenverarbeitung'
    },
    {
      id: 'no_longer_necessary',
      title: 'Zweck erfüllt',
      description: 'Die Daten sind für den ursprünglichen Zweck nicht mehr erforderlich'
    },
    {
      id: 'unlawful_processing',
      title: 'Unrechtmäßige Verarbeitung',
      description: 'Die Datenverarbeitung erfolgt unrechtmäßig'
    },
    {
      id: 'objection',
      title: 'Widerspruch eingelegt',
      description: 'Ich habe der Verarbeitung widersprochen'
    }
  ]

  const dataCategories = [
    {
      id: 'applications',
      name: 'Anträge',
      description: 'Kita-Gutschein und Elterngeld Anträge',
      deletable: false,
      reason: 'Gesetzliche Aufbewahrungspflicht (7 Jahre)'
    },
    {
      id: 'documents',
      name: 'Hochgeladene Dokumente',
      description: 'Von Ihnen hochgeladene Dateien und Dokumente',
      deletable: true
    },
    {
      id: 'communications',
      name: 'Kommunikation',
      description: 'E-Mail-Verlauf und Benachrichtigungen',
      deletable: true
    },
    {
      id: 'analytics',
      name: 'Nutzungsdaten',
      description: 'Anonyme Nutzungsstatistiken',
      deletable: true
    }
  ]

  const handleSubmitErasure = async () => {
    if (!erasureReason || confirmationText !== 'LÖSCHEN') {
      alert('Bitte füllen Sie alle Pflichtfelder aus und bestätigen Sie die Löschung.')
      return
    }

    if (selectedCategories.length === 0) {
      alert('Bitte wählen Sie mindestens eine Datenkategorie zur Löschung aus.')
      return
    }

    setIsLoading(true)
    try {
      const newRequest: ErasureRequest = {
        id: Date.now().toString(),
        requestDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        reason: erasureReason,
        scope: selectedCategories.length === dataCategories.filter(c => c.deletable).length ? 'complete' : 'partial',
        dataCategories: selectedCategories
      }

      setErasureRequests(prev => [newRequest, ...prev])
      alert('Ihr Löschantrag wurde erfolgreich eingereicht. Sie erhalten eine Bestätigungs-E-Mail.')
      
      // Reset form
      setErasureReason('')
      setSelectedCategories([])
      setConfirmationText('')
    } catch (error) {
      console.error('Error submitting erasure request:', error)
      alert('Fehler beim Einreichen des Löschantrags.')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: ErasureRequest['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: ErasureRequest['status']) => {
    switch (status) {
      case 'pending': return 'Ausstehend'
      case 'approved': return 'Genehmigt'
      case 'completed': return 'Gelöscht'
      case 'rejected': return 'Abgelehnt'
      default: return 'Unbekannt'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-2xl">🗑️</span>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Recht auf Löschung</h2>
            <p className="text-sm text-gray-500">DSGVO Artikel 17</p>
          </div>
        </div>
        <p className="text-gray-600">
          Sie haben das Recht, von uns zu verlangen, dass Sie betreffende personenbezogene 
          Daten unverzüglich gelöscht werden.
        </p>
      </div>

      {/* Warning */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="font-medium text-red-900 mb-2">⚠️ Wichtiger Hinweis</h3>
        <div className="text-sm text-red-800">
          <p className="mb-2">
            Die Löschung Ihrer Daten ist <strong>unwiderruflich</strong>. Bitte überlegen Sie sorgfältig, 
            welche Daten Sie löschen möchten.
          </p>
          <p>
            <strong>Beachten Sie:</strong> Bestimmte Daten können aufgrund gesetzlicher Aufbewahrungspflichten 
            nicht gelöscht werden (z.B. Anträge für 7 Jahre).
          </p>
        </div>
      </div>

      {/* Erasure Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Löschantrag stellen</h3>
        
        <div className="space-y-6">
          {/* Reason Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grund für die Löschung *
            </label>
            <div className="space-y-2">
              {erasureReasons.map((reason) => (
                <label key={reason.id} className="flex items-start space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg">
                  <input
                    type="radio"
                    value={reason.id}
                    checked={erasureReason === reason.id}
                    onChange={(e) => setErasureReason(e.target.value)}
                    className="text-red-600 mt-1"
                  />
                  <div>
                    <div className="font-medium text-sm">{reason.title}</div>
                    <div className="text-xs text-gray-500">{reason.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Data Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zu löschende Datenkategorien *
            </label>
            <div className="space-y-2">
              {dataCategories.map((category) => (
                <div key={category.id} className="flex items-start justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={(e) => {
                        if (e.target.checked && category.deletable) {
                          setSelectedCategories(prev => [...prev, category.id])
                        } else {
                          setSelectedCategories(prev => prev.filter(id => id !== category.id))
                        }
                      }}
                      disabled={!category.deletable}
                      className="text-red-600 mt-1"
                    />
                    <div>
                      <div className="font-medium text-sm">{category.name}</div>
                      <div className="text-xs text-gray-500">{category.description}</div>
                      {!category.deletable && category.reason && (
                        <div className="text-xs text-red-600 mt-1">
                          Nicht löschbar: {category.reason}
                        </div>
                      )}
                    </div>
                  </div>
                  {!category.deletable && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                      Aufbewahrungspflicht
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Confirmation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bestätigung der Löschung *
            </label>
            <p className="text-sm text-gray-600 mb-2">
              Geben Sie "LÖSCHEN" ein, um zu bestätigen, dass Sie die ausgewählten Daten 
              unwiderruflich löschen möchten:
            </p>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="LÖSCHEN"
              className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <Button
            onClick={handleSubmitErasure}
            disabled={isLoading || !erasureReason || confirmationText !== 'LÖSCHEN' || selectedCategories.length === 0}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? 'Wird eingereicht...' : 'Löschantrag einreichen'}
          </Button>
        </div>
      </div>

      {/* Erasure History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Löschhistorie</h3>
        
        {erasureRequests.length === 0 ? (
          <p className="text-gray-500 text-sm">Sie haben noch keine Löschanträge gestellt.</p>
        ) : (
          <div className="space-y-4">
            {erasureRequests.map((request) => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium">Antrag vom {request.requestDate}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusText(request.status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {request.scope === 'complete' ? 'Vollständige Löschung' : 'Teilweise Löschung'}
                  </div>
                </div>
                
                <div className="text-sm">
                  <div className="font-medium text-gray-700 mb-1">Grund:</div>
                  <div className="text-gray-600 mb-3">
                    {erasureReasons.find(r => r.id === request.reason)?.title}
                  </div>
                  
                  <div className="font-medium text-gray-700 mb-1">Datenkategorien:</div>
                  <div className="text-gray-600">
                    {request.dataCategories.map(cat => 
                      dataCategories.find(c => c.id === cat)?.name
                    ).join(', ')}
                  </div>
                </div>

                {request.status === 'rejected' && request.rejectionReason && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                    <div className="font-medium text-red-900 text-sm">Ablehnungsgrund:</div>
                    <div className="text-red-800 text-sm">{request.rejectionReason}</div>
                  </div>
                )}

                {request.completionDate && (
                  <div className="text-xs text-gray-500 mt-3">
                    {request.status === 'completed' ? 'Gelöscht am:' : 'Abgeschlossen am:'} {request.completionDate}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legal Information */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="font-medium text-red-900 mb-2">🔒 Rechtliche Hinweise</h4>
        <div className="text-sm text-red-800 space-y-2">
          <p>
            <strong>Ausnahmen:</strong> Löschung ist nicht möglich bei gesetzlichen Aufbewahrungspflichten, 
            berechtigten Interessen oder laufenden Rechtstreitigkeiten.
          </p>
          <p>
            <strong>Bearbeitungszeit:</strong> Löschanträge werden innerhalb von 30 Tagen bearbeitet.
          </p>
          <p>
            <strong>Unwiderruflich:</strong> Gelöschte Daten können nicht wiederhergestellt werden.
          </p>
        </div>
      </div>
    </div>
  )
} 