'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface CorrectionRequest {
  id: string
  requestDate: string
  status: 'pending' | 'approved' | 'completed' | 'rejected'
  field: string
  oldValue: string
  newValue: string
  reason: string
  completionDate?: string
}

export default function DataRectificationPanel() {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedField, setSelectedField] = useState('')
  const [currentValue, setCurrentValue] = useState('')
  const [newValue, setNewValue] = useState('')
  const [reason, setReason] = useState('')
  const [correctionRequests, setCorrectionRequests] = useState<CorrectionRequest[]>([
    {
      id: '1',
      requestDate: '2024-05-28',
      status: 'completed',
      field: 'E-Mail-Adresse',
      oldValue: 'alte.email@beispiel.de',
      newValue: 'neue.email@beispiel.de',
      reason: 'E-Mail-Adresse geändert',
      completionDate: '2024-05-30'
    }
  ])

  const editableFields = [
    { id: 'email', name: 'E-Mail-Adresse', value: 'max.mustermann@beispiel.de' },
    { id: 'phone', name: 'Telefonnummer', value: '040 12345678' },
    { id: 'address', name: 'Adresse', value: 'Musterstraße 123, 20095 Hamburg' },
    { id: 'employment', name: 'Arbeitgeber', value: 'Musterfirma GmbH' },
  ]

  const handleSubmitCorrection = async () => {
    if (!selectedField || !newValue.trim() || !reason.trim()) {
      alert('Bitte füllen Sie alle Pflichtfelder aus.')
      return
    }

    setIsLoading(true)
    try {
      const field = editableFields.find(f => f.id === selectedField)
      const newRequest: CorrectionRequest = {
        id: Date.now().toString(),
        requestDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        field: field?.name || selectedField,
        oldValue: currentValue,
        newValue,
        reason
      }

      setCorrectionRequests(prev => [newRequest, ...prev])
      alert('Ihr Berichtigungsantrag wurde erfolgreich eingereicht.')
      
      // Reset form
      setSelectedField('')
      setCurrentValue('')
      setNewValue('')
      setReason('')
    } catch (error) {
      console.error('Error submitting correction request:', error)
      alert('Fehler beim Einreichen des Antrags.')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: CorrectionRequest['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: CorrectionRequest['status']) => {
    switch (status) {
      case 'pending': return 'Ausstehend'
      case 'approved': return 'Genehmigt'
      case 'completed': return 'Abgeschlossen'
      case 'rejected': return 'Abgelehnt'
      default: return 'Unbekannt'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-2xl">✏️</span>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Recht auf Berichtigung</h2>
            <p className="text-sm text-gray-500">DSGVO Artikel 16</p>
          </div>
        </div>
        <p className="text-gray-600">
          Sie haben das Recht, von uns unverzüglich die Berichtigung Sie betreffender 
          unrichtiger personenbezogener Daten zu verlangen.
        </p>
      </div>

      {/* Current Data Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ihre aktuellen Daten</h3>
        <div className="space-y-3">
          {editableFields.map((field) => (
            <div key={field.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <div className="font-medium text-sm">{field.name}</div>
                <div className="text-sm text-gray-600">{field.value}</div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedField(field.id)
                  setCurrentValue(field.value)
                }}
              >
                Bearbeiten
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Correction Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Datenberichtigung beantragen</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zu berichtigendes Feld *
            </label>
            <select
              value={selectedField}
              onChange={(e) => {
                setSelectedField(e.target.value)
                const field = editableFields.find(f => f.id === e.target.value)
                setCurrentValue(field?.value || '')
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Bitte wählen...</option>
              {editableFields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.name}
                </option>
              ))}
            </select>
          </div>

          {selectedField && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aktueller Wert
                </label>
                <Input
                  value={currentValue}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Neuer korrekter Wert *
                </label>
                <Input
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Geben Sie den korrekten Wert ein"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Begründung der Änderung *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Bitte erläutern Sie, warum diese Änderung notwendig ist..."
                />
              </div>

              <Button
                onClick={handleSubmitCorrection}
                disabled={isLoading || !newValue.trim() || !reason.trim()}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                {isLoading ? 'Wird eingereicht...' : 'Berichtigung beantragen'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Correction History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Berichtigungshistorie</h3>
        
        {correctionRequests.length === 0 ? (
          <p className="text-gray-500 text-sm">Sie haben noch keine Berichtigungsanträge gestellt.</p>
        ) : (
          <div className="space-y-4">
            {correctionRequests.map((request) => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium">Antrag vom {request.requestDate}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusText(request.status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {request.field}
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-700">Alter Wert:</div>
                    <div className="text-gray-600 bg-red-50 border border-red-200 rounded p-2 mt-1">
                      {request.oldValue}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Neuer Wert:</div>
                    <div className="text-gray-600 bg-green-50 border border-green-200 rounded p-2 mt-1">
                      {request.newValue}
                    </div>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="font-medium text-gray-700 text-sm">Begründung:</div>
                  <div className="text-gray-600 text-sm mt-1">{request.reason}</div>
                </div>

                {request.completionDate && (
                  <div className="text-xs text-gray-500 mt-3">
                    Abgeschlossen am: {request.completionDate}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legal Information */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">ℹ️ Wichtige Hinweise</h4>
        <div className="text-sm text-yellow-800 space-y-2">
          <p>
            <strong>Bearbeitungszeit:</strong> Berichtigungsanträge werden innerhalb von 30 Tagen bearbeitet.
          </p>
          <p>
            <strong>Nachweis:</strong> Bei wesentlichen Änderungen können wir einen Nachweis der Richtigkeit verlangen.
          </p>
          <p>
            <strong>Benachrichtigung:</strong> Empfänger Ihrer Daten werden über Berichtigungen informiert, soweit möglich.
          </p>
        </div>
      </div>
    </div>
  )
} 