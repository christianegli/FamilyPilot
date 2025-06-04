'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { 
  kitaApplicationSchema, 
  type KitaApplicationFormData,
  BETREUUNGSGRUND_OPTIONS,
  BETREUUNGSUMFANG_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS
} from '@/lib/validations'

type Step = 'parent' | 'child' | 'employment' | 'care' | 'review'

export default function KitaGutscheinPage() {
  const [currentStep, setCurrentStep] = useState<Step>('parent')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<KitaApplicationFormData>({
    resolver: zodResolver(kitaApplicationSchema),
    defaultValues: {
      parent: {
        staatsangehoerigkeit: 'deutsch',
        ort: 'Hamburg',
      },
      child: {
        geburtsort: 'Hamburg',
      },
      employment: {
        beschaeftigung_typ: 'ANGESTELLT',
      },
      betreuungsumfang: '5',
      betreuungsgrund: 'BERUFSTAETIGKEIT',
      anzahl_kinder_im_haushalt: 1,
      familienstand: 'VERHEIRATET',
      integrationshilfe_benoetigt: false,
    },
  })

  const { register, handleSubmit, formState: { errors }, trigger, watch, setValue } = form
  const watchedValues = watch()

  const steps: { key: Step; title: string; description: string }[] = [
    { key: 'parent', title: 'Ihre Daten', description: 'Persönliche Angaben des Antragstellers' },
    { key: 'child', title: 'Kind', description: 'Angaben zum Kind' },
    { key: 'employment', title: 'Berufstätigkeit', description: 'Arbeitssituation und Einkommen' },
    { key: 'care', title: 'Betreuung', description: 'Betreuungsumfang und -grund' },
    { key: 'review', title: 'Überprüfung', description: 'Kontrolle der Angaben' },
  ]

  const currentStepIndex = steps.findIndex(step => step.key === currentStep)
  const isLastStep = currentStepIndex === steps.length - 1

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep)
    const isValid = await trigger(fieldsToValidate)
    
    if (isValid && !isLastStep) {
      const nextStepIndex = currentStepIndex + 1
      setCurrentStep(steps[nextStepIndex].key)
    }
  }

  const prevStep = () => {
    if (currentStepIndex > 0) {
      const prevStepIndex = currentStepIndex - 1
      setCurrentStep(steps[prevStepIndex].key)
    }
  }

  const getFieldsForStep = (step: Step): (keyof KitaApplicationFormData)[] => {
    switch (step) {
      case 'parent':
        return ['parent']
      case 'child':
        return ['child']
      case 'employment':
        return ['employment']
      case 'care':
        return ['betreuungsumfang', 'betreuungsgrund', 'wunsch_startdatum', 'anzahl_kinder_im_haushalt', 'familienstand']
      default:
        return []
    }
  }

  const onSubmit = async (data: KitaApplicationFormData) => {
    setIsSubmitting(true)
    try {
      // TODO: Submit to API
      console.log('Kita application data:', data)
      alert('Antrag erfolgreich eingereicht! (Demo)')
    } catch (error) {
      console.error('Error submitting application:', error)
      alert('Fehler beim Einreichen des Antrags')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Kita-Gutschein Hamburg
          </h1>
          <p className="text-gray-600">
            Beantragen Sie Ihren Kita-Gutschein in wenigen Schritten
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.key} className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= currentStepIndex 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <div className="text-xs text-center mt-2">
                  <div className="font-medium">{step.title}</div>
                  <div className="text-gray-500">{step.description}</div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-full h-0.5 mt-4 ${
                    index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-lg p-8">
          {/* Step 1: Parent Information */}
          {currentStep === 'parent' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Ihre persönlichen Daten</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vorname *
                  </label>
                  <Input
                    {...register('parent.first_name')}
                    placeholder="Ihr Vorname"
                  />
                  {errors.parent?.first_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.parent.first_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nachname *
                  </label>
                  <Input
                    {...register('parent.last_name')}
                    placeholder="Ihr Nachname"
                  />
                  {errors.parent?.last_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.parent.last_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Geburtsdatum *
                  </label>
                  <Input
                    type="date"
                    {...register('parent.geburtsdatum')}
                  />
                  {errors.parent?.geburtsdatum && (
                    <p className="text-red-500 text-sm mt-1">{errors.parent.geburtsdatum.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Staatsangehörigkeit
                  </label>
                  <Input
                    {...register('parent.staatsangehoerigkeit')}
                    placeholder="deutsch"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Straße *
                  </label>
                  <Input
                    {...register('parent.strasse')}
                    placeholder="Musterstraße"
                  />
                  {errors.parent?.strasse && (
                    <p className="text-red-500 text-sm mt-1">{errors.parent.strasse.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hausnummer *
                  </label>
                  <Input
                    {...register('parent.hausnummer')}
                    placeholder="123"
                  />
                  {errors.parent?.hausnummer && (
                    <p className="text-red-500 text-sm mt-1">{errors.parent.hausnummer.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PLZ *
                  </label>
                  <Input
                    {...register('parent.plz')}
                    placeholder="20095"
                  />
                  {errors.parent?.plz && (
                    <p className="text-red-500 text-sm mt-1">{errors.parent.plz.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ort
                  </label>
                  <Input
                    {...register('parent.ort')}
                    placeholder="Hamburg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-Mail *
                  </label>
                  <Input
                    type="email"
                    {...register('parent.email')}
                    placeholder="ihre.email@beispiel.de"
                  />
                  {errors.parent?.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.parent.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon *
                  </label>
                  <Input
                    {...register('parent.telefon')}
                    placeholder="040 12345678"
                  />
                  {errors.parent?.telefon && (
                    <p className="text-red-500 text-sm mt-1">{errors.parent.telefon.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Child Information */}
          {currentStep === 'child' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Angaben zum Kind</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vorname des Kindes *
                  </label>
                  <Input
                    {...register('child.vorname')}
                    placeholder="Vorname des Kindes"
                  />
                  {errors.child?.vorname && (
                    <p className="text-red-500 text-sm mt-1">{errors.child.vorname.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nachname des Kindes *
                  </label>
                  <Input
                    {...register('child.nachname')}
                    placeholder="Nachname des Kindes"
                  />
                  {errors.child?.nachname && (
                    <p className="text-red-500 text-sm mt-1">{errors.child.nachname.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Geburtsdatum des Kindes *
                  </label>
                  <Input
                    type="date"
                    {...register('child.geburtsdatum')}
                  />
                  {errors.child?.geburtsdatum && (
                    <p className="text-red-500 text-sm mt-1">{errors.child.geburtsdatum.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Geburtsort
                  </label>
                  <Input
                    {...register('child.geburtsort')}
                    placeholder="Hamburg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Employment Information */}
          {currentStep === 'employment' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Berufstätigkeit</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beschäftigungsart *
                  </label>
                  <Select
                    {...register('employment.beschaeftigung_typ')}
                    options={EMPLOYMENT_TYPE_OPTIONS}
                  />
                  {errors.employment?.beschaeftigung_typ && (
                    <p className="text-red-500 text-sm mt-1">{errors.employment.beschaeftigung_typ.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arbeitgeber
                  </label>
                  <Input
                    {...register('employment.arbeitgeber')}
                    placeholder="Name des Arbeitgebers"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wochenstunden
                  </label>
                  <Input
                    type="number"
                    {...register('employment.wochenstunden', { valueAsNumber: true })}
                    placeholder="40"
                  />
                  {errors.employment?.wochenstunden && (
                    <p className="text-red-500 text-sm mt-1">{errors.employment.wochenstunden.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Netto-Monatseinkommen (€)
                  </label>
                  <Input
                    type="number"
                    {...register('employment.netto_monat_einkommen', { valueAsNumber: true })}
                    placeholder="3000"
                  />
                  {errors.employment?.netto_monat_einkommen && (
                    <p className="text-red-500 text-sm mt-1">{errors.employment.netto_monat_einkommen.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beschäftigungsbeginn
                  </label>
                  <Input
                    type="date"
                    {...register('employment.start_datum')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beschäftigungsende (falls befristet)
                  </label>
                  <Input
                    type="date"
                    {...register('employment.end_datum')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Care Requirements */}
          {currentStep === 'care' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Betreuungsanforderungen</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Betreuungsumfang *
                  </label>
                  <Select
                    {...register('betreuungsumfang')}
                    options={BETREUUNGSUMFANG_OPTIONS}
                  />
                  {errors.betreuungsumfang && (
                    <p className="text-red-500 text-sm mt-1">{errors.betreuungsumfang.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Betreuungsgrund *
                  </label>
                  <Select
                    {...register('betreuungsgrund')}
                    options={BETREUUNGSGRUND_OPTIONS}
                  />
                  {errors.betreuungsgrund && (
                    <p className="text-red-500 text-sm mt-1">{errors.betreuungsgrund.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gewünschter Betreuungsbeginn *
                  </label>
                  <Input
                    type="date"
                    {...register('wunsch_startdatum')}
                    min={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // 3 months from now
                  />
                  {errors.wunsch_startdatum && (
                    <p className="text-red-500 text-sm mt-1">{errors.wunsch_startdatum.message}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    Mindestens 3 Monate im Voraus beantragen
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Familienstand *
                  </label>
                  <Select
                    {...register('familienstand')}
                    options={[
                      { value: 'LEDIG', label: 'Ledig' },
                      { value: 'VERHEIRATET', label: 'Verheiratet' },
                      { value: 'GESCHIEDEN', label: 'Geschieden' },
                      { value: 'VERWITWET', label: 'Verwitwet' },
                      { value: 'LEBENSPARTNERSCHAFT', label: 'Lebenspartnerschaft' },
                    ]}
                  />
                  {errors.familienstand && (
                    <p className="text-red-500 text-sm mt-1">{errors.familienstand.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anzahl Kinder im Haushalt *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    {...register('anzahl_kinder_im_haushalt', { valueAsNumber: true })}
                    placeholder="1"
                  />
                  {errors.anzahl_kinder_im_haushalt && (
                    <p className="text-red-500 text-sm mt-1">{errors.anzahl_kinder_im_haushalt.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('integrationshilfe_benoetigt')}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Integrationshilfe benötigt
                    </span>
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Besondere Bedürfnisse
                  </label>
                  <textarea
                    {...register('besondere_beduerfnisse')}
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Beschreiben Sie besondere Bedürfnisse Ihres Kindes..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 'review' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Überprüfung Ihrer Angaben</h2>
              
              <div className="space-y-8">
                {/* Parent Data Review */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Ihre Daten</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><strong>Name:</strong> {watchedValues.parent?.first_name} {watchedValues.parent?.last_name}</p>
                    <p><strong>Geburtsdatum:</strong> {watchedValues.parent?.geburtsdatum}</p>
                    <p><strong>Adresse:</strong> {watchedValues.parent?.strasse} {watchedValues.parent?.hausnummer}, {watchedValues.parent?.plz} {watchedValues.parent?.ort}</p>
                    <p><strong>E-Mail:</strong> {watchedValues.parent?.email}</p>
                    <p><strong>Telefon:</strong> {watchedValues.parent?.telefon}</p>
                  </div>
                </div>

                {/* Child Data Review */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Kind</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><strong>Name:</strong> {watchedValues.child?.vorname} {watchedValues.child?.nachname}</p>
                    <p><strong>Geburtsdatum:</strong> {watchedValues.child?.geburtsdatum}</p>
                    <p><strong>Geburtsort:</strong> {watchedValues.child?.geburtsort}</p>
                  </div>
                </div>

                {/* Employment Review */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Berufstätigkeit</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><strong>Beschäftigungsart:</strong> {EMPLOYMENT_TYPE_OPTIONS.find(opt => opt.value === watchedValues.employment?.beschaeftigung_typ)?.label}</p>
                    {watchedValues.employment?.arbeitgeber && <p><strong>Arbeitgeber:</strong> {watchedValues.employment.arbeitgeber}</p>}
                    {watchedValues.employment?.wochenstunden && <p><strong>Wochenstunden:</strong> {watchedValues.employment.wochenstunden}</p>}
                    {watchedValues.employment?.netto_monat_einkommen && <p><strong>Netto-Monatseinkommen:</strong> {watchedValues.employment.netto_monat_einkommen}€</p>}
                  </div>
                </div>

                {/* Care Requirements Review */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Betreuung</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><strong>Betreuungsumfang:</strong> {BETREUUNGSUMFANG_OPTIONS.find(opt => opt.value === watchedValues.betreuungsumfang)?.label}</p>
                    <p><strong>Betreuungsgrund:</strong> {BETREUUNGSGRUND_OPTIONS.find(opt => opt.value === watchedValues.betreuungsgrund)?.label}</p>
                    <p><strong>Gewünschter Beginn:</strong> {watchedValues.wunsch_startdatum}</p>
                    <p><strong>Familienstand:</strong> {watchedValues.familienstand}</p>
                    <p><strong>Kinder im Haushalt:</strong> {watchedValues.anzahl_kinder_im_haushalt}</p>
                    {watchedValues.integrationshilfe_benoetigt && <p><strong>Integrationshilfe:</strong> Ja</p>}
                    {watchedValues.besondere_beduerfnisse && <p><strong>Besondere Bedürfnisse:</strong> {watchedValues.besondere_beduerfnisse}</p>}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Nächste Schritte:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Nach dem Absenden erhalten Sie eine Bestätigung per E-Mail</li>
                    <li>• Die Bearbeitung dauert in der Regel 2-4 Wochen</li>
                    <li>• Der Gutschein wird Ihnen per Post zugeschickt</li>
                    <li>• Mit dem Gutschein können Sie sich bei einer Kita Ihrer Wahl anmelden</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStepIndex === 0}
            >
              Zurück
            </Button>

            {isLastStep ? (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? 'Wird eingereicht...' : 'Antrag einreichen'}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Weiter
              </Button>
            )}
          </div>
        </form>

        {/* Information Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Wichtige Hinweise:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Beantragen Sie den Kita-Gutschein 3-6 Monate vor dem gewünschten Betreuungsbeginn</li>
            <li>• Der Gutschein ist ein Jahr gültig und muss rechtzeitig verlängert werden</li>
            <li>• Sie können den Gutschein bei über 1.100 teilnehmenden Kitas in Hamburg einlösen</li>
            <li>• Der Elternbeitrag richtet sich nach Familiengröße und Einkommen</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 