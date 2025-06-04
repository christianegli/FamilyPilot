'use client'

import { useState, useEffect, useCallback } from 'react'
import { ConsentService, type ConsentRequest } from './consent-service'
import { createClient } from '@/lib/supabase/client'
import type { UserConsent } from '@/types/database'

export interface UseConsentOptions {
  applicationContext?: 'kita' | 'elterngeld'
  autoLoadUserConsents?: boolean
}

export interface UseConsentReturn {
  consents: Record<string, boolean>
  userConsents: UserConsent[]
  isLoading: boolean
  error: string | null
  grantConsents: (consents: Record<string, boolean>) => Promise<boolean>
  checkRequiredConsents: () => Promise<boolean>
  refreshConsents: () => Promise<void>
  consentSummary: {
    totalConsents: number
    activeConsents: number
    withdrawnConsents: number
    expiredConsents: number
    lastActivity: string | null
  } | null
}

export function useConsent(options: UseConsentOptions = {}): UseConsentReturn {
  const { applicationContext, autoLoadUserConsents = true } = options
  const [consents, setConsents] = useState<Record<string, boolean>>({})
  const [userConsents, setUserConsents] = useState<UserConsent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [consentSummary, setConsentSummary] = useState<UseConsentReturn['consentSummary']>(null)

  const supabase = createClient()
  const consentService = new ConsentService()

  // Get current user
  const getCurrentUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }, [supabase])

  // Load user's existing consents
  const loadUserConsents = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const user = await getCurrentUser()
      if (!user) {
        setError('User not authenticated')
        return
      }

      const existingConsents = await consentService.getUserConsents(user.id)
      setUserConsents(existingConsents)

      // Convert to boolean format for UI
      const consentMap: Record<string, boolean> = {}
      existingConsents.forEach(consent => {
        if (consent.status === 'GRANTED') {
          consentMap[consent.consent_type] = true
        }
      })
      setConsents(consentMap)

      // Load consent summary
      const summary = await consentService.getConsentSummary(user.id)
      setConsentSummary(summary)

    } catch (err) {
      console.error('Error loading user consents:', err)
      setError('Failed to load consent preferences')
    } finally {
      setIsLoading(false)
    }
  }, [consentService, getCurrentUser])

  // Grant multiple consents based on UI state
  const grantConsents = useCallback(async (consentChoices: Record<string, boolean>): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)

      const user = await getCurrentUser()
      if (!user) {
        setError('User not authenticated')
        return false
      }

      const consentsToGrant: ConsentRequest[] = []

      // Map UI choices to consent requests
      Object.entries(consentChoices).forEach(([consentType, granted]) => {
        if (granted) {
          let purpose = ''
          let legalBasis = ''

          switch (consentType) {
            case 'data_processing':
              purpose = 'Antragstellung und -bearbeitung für Hamburg Familienservices'
              legalBasis = 'Art. 6.1.e GDPR (public task) + Art. 6.1.a GDPR (consent)'
              break
            case 'child_data':
              purpose = 'Identifikation und Berechtigung für Betreuungs-/Unterstützungsleistungen'
              legalBasis = 'Art. 9.2.a GDPR (explicit consent for special categories)'
              break
            case 'financial_data':
              purpose = applicationContext === 'kita' 
                ? 'Berechnung des Elternbeitrags' 
                : 'Berechnung der Elterngeld-Höhe'
              legalBasis = 'Art. 6.1.a GDPR (consent) + Art. 6.1.e GDPR (public task)'
              break
            case 'document_vault':
              purpose = 'Vereinfachung zukünftiger Antragsstellungen'
              legalBasis = 'Art. 6.1.a GDPR (consent)'
              break
            case 'email_notifications':
              purpose = 'Information über Antragsfortschritt und wichtige Fristen'
              legalBasis = 'Art. 6.1.a GDPR (consent)'
              break
            case 'analytics':
              purpose = 'Service-Verbesserung und Benutzerfreundlichkeit'
              legalBasis = 'Art. 6.1.a GDPR (consent)'
              break
            default:
              purpose = 'Data processing for application'
              legalBasis = 'Art. 6.1.a GDPR (consent)'
          }

          consentsToGrant.push({
            consent_type: consentType,
            purpose,
            legal_basis: legalBasis,
            application_context: applicationContext
          })
        }
      })

      // Grant all consents
      const results = await consentService.grantMultipleConsents(user.id, consentsToGrant)
      
      if (results.length > 0) {
        setConsents(consentChoices)
        await loadUserConsents() // Refresh the data
        return true
      }

      return false
    } catch (err) {
      console.error('Error granting consents:', err)
      setError('Failed to save consent preferences')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [consentService, getCurrentUser, applicationContext, loadUserConsents])

  // Check if user has all required consents
  const checkRequiredConsents = useCallback(async (): Promise<boolean> => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return false
      }

      if (!applicationContext) {
        return false
      }

      const result = await consentService.checkRequiredConsents(user.id, applicationContext)
      return result.hasAllRequired
    } catch (err) {
      console.error('Error checking required consents:', err)
      return false
    }
  }, [consentService, getCurrentUser, applicationContext])

  // Refresh consents from database
  const refreshConsents = useCallback(async () => {
    await loadUserConsents()
  }, [loadUserConsents])

  // Load consents on mount if enabled
  useEffect(() => {
    if (autoLoadUserConsents) {
      loadUserConsents()
    }
  }, [autoLoadUserConsents, loadUserConsents])

  return {
    consents,
    userConsents,
    isLoading,
    error,
    grantConsents,
    checkRequiredConsents,
    refreshConsents,
    consentSummary
  }
} 