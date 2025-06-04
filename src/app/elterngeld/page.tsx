'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import GdprConsent from '@/components/GdprConsent'
import PrivacyPolicy from '@/components/PrivacyPolicy'
import { useConsent } from '@/lib/gdpr/use-consent'
import { 
  elterngeldApplicationSchema, 
  type ElterngeldApplicationFormData,
  ELTERNGELD_TYP_OPTIONS,
  HAMBURG_BEZIRKSAMT_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  ELTERNGELD_INCOME_LIMITS
} from '@/lib/validations'

type Step = 'consent' | 'parent' | 'child' | 'employment' | 'elterngeld' | 'review'

export default function ElterngeldPage() {
  const [currentStep, setCurrentStep] = useState<Step>('consent')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false)

  // GDPR Consent Management
  const {
    consents,
    isLoading: consentLoading,
    error: consentError,
    grantConsents,
    checkRequiredConsents
  } = useConsent({ applicationContext: 'elterngeld' })

  const form = useForm<ElterngeldApplicationFormData>({
    resolver: zodResolver(elterngeldApplicationSchema),
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
      elterngeld_typ: 'ELTERNGELD',
      bezugsdauer_monate: 12,
      partner_bezieht_elterngeld: false,
      arbeitszeit_reduzierung: false,
      bezirksamt: 'HAMBURG_MITTE',
    },
  })

  const { register, handleSubmit, formState: { errors }, trigger, watch } = form
  const watchedValues = watch()

  const steps: { key: Step; title: string; description: string }[] = [
    { key: 'consent', title: 'Datenschutz', description: 'Einwilligungen zur Datenverarbeitung' },
    { key: 'parent', title: 'Ihre Daten', description: 'Persönliche Angaben des Antragstellers' },
    { key: 'child', title: 'Kind', description: 'Angaben zum Kind' },
    { key: 'employment', title: 'Berufstätigkeit', description: 'Arbeitssituation und Einkommen' },
    { key: 'elterngeld', title: 'Elterngeld', description: 'Elterngeld-Typ und Bezugsdauer' },
    { key: 'review', title: 'Überprüfung', description: 'Kontrolle der Angaben' },
  ]

  const currentStepIndex = steps.findIndex(step => step.key === currentStep)
  const isLastStep = currentStepIndex === steps.length - 1

  const nextStep = async () => {
    // Special handling for consent step
    if (currentStep === 'consent') {
      const hasRequiredConsents = await checkRequiredConsents()
      if (!hasRequiredConsents) {
        alert('Bitte stimmen Sie allen erforderlichen Einwilligungen zu, um fortzufahren.')
        return
      }
    } else {
      // Regular form validation for other steps
      const fieldsToValidate = getFieldsForStep(currentStep)
      const isValid = await trigger(fieldsToValidate)
      if (!isValid) {
        return
      }
    }
    
    if (!isLastStep) {
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

  const getFieldsForStep = (step: Step): (keyof ElterngeldApplicationFormData)[] => {
    switch (step) {
      case 'consent':
        return [] // No form fields to validate for consent
      case 'parent':
        return ['parent']
      case 'child':
        return ['child']
      case 'employment':
        return ['employment']
      case 'elterngeld':
        return ['elterngeld_typ', 'bezugsdauer_monate', 'jahreseinkommen_vor_geburt', 'bezirksamt']
      default:
        return []
    }
  }

  const handleConsentChange = async (newConsents: Record<string, boolean>) => {
    try {
      await grantConsents(newConsents)
    } catch (error) {
      console.error('Error saving consents:', error)
    }
  }

  const onSubmit = async (data: ElterngeldApplicationFormData) => {
    setIsSubmitting(true)
    try {
      // Check final consent validation before submission
      const hasRequiredConsents = await checkRequiredConsents()
      if (!hasRequiredConsents) {
        alert('Alle erforderlichen Einwilligungen müssen erteilt werden, bevor Sie den Antrag einreichen können.')
        setIsSubmitting(false)
        return
      }

      // TODO: Submit to API with consent validation
      console.log('Elterngeld application data:', data)
      console.log('User consents:', consents)
      alert('Elterngeld-Antrag erfolgreich eingereicht! (Demo)')
    } catch (error) {
      console.error('Error submitting application:', error)
      alert('Fehler beim Einreichen des Antrags')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate income eligibility based on child's birth date
  const getIncomeLimit = () => {
    const childBirthDate = new Date(watchedValues.child?.geburtsdatum || '')
    const april2025 = new Date('2025-04-01')
    const april2024 = new Date('2024-04-01')
    
    if (childBirthDate >= april2025) {
      return ELTERNGELD_INCOME_LIMITS.CHILDREN_BORN_AFTER_APRIL_2025
    } else if (childBirthDate >= april2024) {
      return ELTERNGELD_INCOME_LIMITS.CHILDREN_BORN_AFTER_APRIL_2024
    }
    return null // No income limit for children born before April 2024
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Elterngeld Hamburg
          </h1>
          <p className="text-gray-600">
            Beantragen Sie Ihr Elterngeld in wenigen Schritten
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.key} className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= currentStepIndex 
                    ? 'bg-green-600 text-white' 
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
                    index < currentStepIndex ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-lg p-8">
          {/* Step 1: Consent */}
          {currentStep === 'consent' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Datenschutz und Einwilligungen</h2>
              
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-lg font-medium text-green-900 mb-2">
                  Wichtige Information zur Datenverarbeitung
                </h3>
                <p className="text-sm text-green-800">
                  Für die Bearbeitung Ihres Elterngeld-Antrags benötigen wir Ihre Einwilligung 
                  zur Verarbeitung Ihrer personenbezogenen Daten. Alle Daten werden ausschließlich 
                  für die Antragstellung und -bearbeitung verwendet und gemäß der DSGVO verarbeitet.
                </p>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setShowPrivacyPolicy(true)}
                    className="text-sm text-green-600 hover:text-green-800 underline"
                  >
                    📋 Vollständige Datenschutzerklärung lesen
                  </button>
                </div>
              </div>

              <GdprConsent
                onConsentChange={handleConsentChange}
                applicationContext="elterngeld"
              />

              {consentError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-800">
                    ⚠️ Fehler beim Speichern der Einwilligungen: {consentError}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Parent Information */}
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

          {/* Step 3: Child Information */}
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
                  <p className="text-gray-500 text-xs mt-1">
                    Antrag muss innerhalb von 3 Monaten nach Geburt gestellt werden für rückwirkende Zahlung
                  </p>
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

          {/* Step 4: Employment Information */}
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
                    Wochenstunden vor der Geburt
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
                    Netto-Monatseinkommen vor Geburt (€) *
                  </label>
                  <Input
                    type="number"
                    {...register('jahreseinkommen_vor_geburt', { valueAsNumber: true })}
                    placeholder="3000"
                  />
                  {errors.jahreseinkommen_vor_geburt && (
                    <p className="text-red-500 text-sm mt-1">{errors.jahreseinkommen_vor_geburt.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('arbeitszeit_reduzierung')}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Arbeitszeit während Elternzeit reduzieren (max. 32 Std/Woche)
                    </span>
                  </label>
                </div>

                {watchedValues.arbeitszeit_reduzierung && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Neue Wochenstunden (max. 32)
                    </label>
                    <Input
                      type="number"
                      max="32"
                      {...register('neue_wochenstunden', { valueAsNumber: true })}
                      placeholder="20"
                    />
                    {errors.neue_wochenstunden && (
                      <p className="text-red-500 text-sm mt-1">{errors.neue_wochenstunden.message}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Elterngeld Configuration */}
          {currentStep === 'elterngeld' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Elterngeld-Konfiguration</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Elterngeld-Typ *
                  </label>
                  <Select
                    {...register('elterngeld_typ')}
                    options={ELTERNGELD_TYP_OPTIONS}
                  />
                  {errors.elterngeld_typ && (
                    <p className="text-red-500 text-sm mt-1">{errors.elterngeld_typ.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bezugsdauer (Monate) *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max={watchedValues.elterngeld_typ === 'ELTERNGELD_PLUS' ? '28' : '14'}
                    {...register('bezugsdauer_monate', { valueAsNumber: true })}
                    placeholder="12"
                  />
                  {errors.bezugsdauer_monate && (
                    <p className="text-red-500 text-sm mt-1">{errors.bezugsdauer_monate.message}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    {watchedValues.elterngeld_typ === 'ELTERNGELD_PLUS' 
                      ? 'ElterngeldPlus: bis zu 28 Monate möglich'
                      : 'Basis-Elterngeld: bis zu 14 Monate möglich'
                    }
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zuständiges Bezirksamt *
                  </label>
                  <Select
                    {...register('bezirksamt')}
                    options={HAMBURG_BEZIRKSAMT_OPTIONS}
                  />
                  {errors.bezirksamt && (
                    <p className="text-red-500 text-sm mt-1">{errors.bezirksamt.message}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    Basierend auf Ihrer Meldeadresse
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Antragsdatum *
                  </label>
                  <Input
                    type="date"
                    {...register('antragsdatum')}
                    min={watchedValues.child?.geburtsdatum}
                  />
                  {errors.antragsdatum && (
                    <p className="text-red-500 text-sm mt-1">{errors.antragsdatum.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('partner_bezieht_elterngeld')}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Partner/in bezieht auch Elterngeld
                    </span>
                  </label>
                </div>

                {watchedValues.partner_bezieht_elterngeld && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name des Partners/der Partnerin
                      </label>
                      <Input
                        {...register('partner_name')}
                        placeholder="Name des Partners"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Geburtsdatum Partner/in
                      </label>
                      <Input
                        type="date"
                        {...register('partner_geburtsdatum')}
                      />
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Besondere Umstände
                  </label>
                  <textarea
                    {...register('besondere_umstaende')}
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Beschreiben Sie besondere Umstände (z.B. Mehrlingsgeburt, Frühgeburt, etc.)..."
                  />
                </div>

                {/* Income Limit Warning */}
                {getIncomeLimit() && (
                  <div className="md:col-span-2 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-900 mb-2">Einkommensgrenze beachten:</h4>
                    <p className="text-sm text-yellow-800">
                      Für Kinder geboren nach {watchedValues.child?.geburtsdatum && new Date(watchedValues.child.geburtsdatum) >= new Date('2025-04-01') ? 'April 2025' : 'April 2024'} 
                      beträgt die Einkommensgrenze {getIncomeLimit()?.toLocaleString()}€ pro Jahr.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 6: Review */}
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
                    {watchedValues.jahreseinkommen_vor_geburt && <p><strong>Einkommen vor Geburt:</strong> {watchedValues.jahreseinkommen_vor_geburt}€</p>}
                    {watchedValues.arbeitszeit_reduzierung && <p><strong>Arbeitszeit reduziert:</strong> Ja{watchedValues.neue_wochenstunden && ` (${watchedValues.neue_wochenstunden} Std/Woche)`}</p>}
                  </div>
                </div>

                {/* Elterngeld Review */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Elterngeld</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><strong>Typ:</strong> {ELTERNGELD_TYP_OPTIONS.find(opt => opt.value === watchedValues.elterngeld_typ)?.label}</p>
                    <p><strong>Bezugsdauer:</strong> {watchedValues.bezugsdauer_monate} Monate</p>
                    <p><strong>Bezirksamt:</strong> {HAMBURG_BEZIRKSAMT_OPTIONS.find(opt => opt.value === watchedValues.bezirksamt)?.label}</p>
                    <p><strong>Antragsdatum:</strong> {watchedValues.antragsdatum}</p>
                    {watchedValues.partner_bezieht_elterngeld && <p><strong>Partner bezieht Elterngeld:</strong> Ja ({watchedValues.partner_name})</p>}
                    {watchedValues.besondere_umstaende && <p><strong>Besondere Umstände:</strong> {watchedValues.besondere_umstaende}</p>}
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">Nächste Schritte:</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Nach dem Absenden erhalten Sie eine Bestätigung per E-Mail</li>
                    <li>• Die Bearbeitung dauert in der Regel 4 Wochen</li>
                    <li>• Das Elterngeld wird rückwirkend ab Geburt gezahlt (bei fristgerechtem Antrag)</li>
                    <li>• Bei Fragen wenden Sie sich an Ihr zuständiges Bezirksamt</li>
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
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? 'Wird eingereicht...' : 'Antrag einreichen'}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={nextStep}
                className="bg-green-600 hover:bg-green-700"
              >
                Weiter
              </Button>
            )}
          </div>
        </form>

        {/* Footer with Privacy Policy and Transparency Links */}
        <div className="mt-8 text-center border-t border-gray-200 pt-6">
          <div className="flex justify-center items-center space-x-6 text-sm text-gray-600">
            <button
              onClick={() => setShowPrivacyPolicy(true)}
              className="hover:text-green-600 transition-colors flex items-center"
            >
              🔒 Datenschutzerklärung
            </button>
            <span className="text-gray-300">|</span>
            <a 
              href="mailto:privacy@familienpilot-hamburg.de"
              className="hover:text-green-600 transition-colors flex items-center"
            >
              📧 Datenschutzbeauftragte
            </a>
            <span className="text-gray-300">|</span>
            <a 
              href="https://datenschutz.hamburg.de"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-green-600 transition-colors flex items-center"
            >
              🏛️ Aufsichtsbehörde
            </a>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Ihre Daten werden gemäß DSGVO verarbeitet und ausschließlich in der EU gespeichert
          </div>
        </div>

        {/* Information Box */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-green-900 mb-2">Wichtige Hinweise zum Elterngeld Hamburg:</h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Antrag kann erst nach der Geburt gestellt werden</li>
            <li>• Für rückwirkende Zahlung innerhalb von 3 Monaten nach Geburt beantragen</li>
            <li>• Mindestbetrag: 300€ pro Monat, Höchstbetrag: 1.800€ pro Monat</li>
            <li>• ElterngeldPlus unterstützt Teilzeitarbeit während der Elternzeit</li>
            <li>• 7 Bezirksämter in Hamburg bearbeiten Elterngeld-Anträge</li>
            <li>• ElterngeldDigital ermöglicht Online-Antragstellung</li>
          </ul>
        </div>
      </div>

      {/* Privacy Policy Modal */}
      {showPrivacyPolicy && (
        <PrivacyPolicy 
          isModal={true}
          onClose={() => setShowPrivacyPolicy(false)}
        />
      )}
    </div>
  )
} 