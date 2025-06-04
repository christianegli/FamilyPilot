import { createClient } from '@/lib/supabase/client'
import type { UserConsent, ConsentStatus } from '@/types/database'

export interface ConsentRequest {
  consent_type: string
  purpose: string
  legal_basis: string
  application_context?: string
  expires_at?: string
  metadata?: Record<string, any>
}

export interface ConsentCheckResult {
  hasConsent: boolean
  consent?: UserConsent
  message?: string
}

export class ConsentService {
  private supabase = createClient()

  /**
   * Grant consent for a specific processing activity
   */
  async grantConsent(userId: string, consent: ConsentRequest): Promise<UserConsent | null> {
    try {
      // Check if consent already exists
      const { data: existingConsent } = await this.supabase
        .from('user_consents')
        .select('*')
        .eq('user_id', userId)
        .eq('consent_type', consent.consent_type)
        .eq('application_context', consent.application_context || null)
        .single()

      if (existingConsent && existingConsent.status === 'GRANTED') {
        // Update existing consent
        const { data, error } = await this.supabase
          .from('user_consents')
          .update({
            ...consent,
            status: 'GRANTED' as ConsentStatus,
            granted_at: new Date().toISOString(),
            withdrawn_at: null,
            withdrawal_reason: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConsent.id)
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        // Create new consent
        const { data, error } = await this.supabase
          .from('user_consents')
          .insert({
            user_id: userId,
            ...consent,
            status: 'GRANTED' as ConsentStatus,
            granted_at: new Date().toISOString()
          })
          .select()
          .single()

        if (error) throw error
        return data
      }
    } catch (error) {
      console.error('Error granting consent:', error)
      return null
    }
  }

  /**
   * Check if user has valid consent for specific processing
   */
  async checkConsent(
    userId: string, 
    consentType: string, 
    applicationContext?: string
  ): Promise<ConsentCheckResult> {
    try {
      const { data, error } = await this.supabase
        .rpc('check_user_consent', {
          p_user_id: userId,
          p_consent_type: consentType,
          p_application_context: applicationContext
        })

      if (error) throw error

      if (data) {
        // Get the actual consent record for details
        const { data: consentRecord } = await this.supabase
          .from('user_consents')
          .select('*')
          .eq('user_id', userId)
          .eq('consent_type', consentType)
          .eq('status', 'GRANTED')
          .order('granted_at', { ascending: false })
          .limit(1)
          .single()

        return {
          hasConsent: true,
          consent: consentRecord || undefined,
          message: 'Valid consent found'
        }
      } else {
        return {
          hasConsent: false,
          message: 'No valid consent found for this processing activity'
        }
      }
    } catch (error) {
      console.error('Error checking consent:', error)
      return {
        hasConsent: false,
        message: 'Error checking consent status'
      }
    }
  }

  /**
   * Withdraw consent for specific processing
   */
  async withdrawConsent(
    userId: string, 
    consentType: string, 
    withdrawalReason?: string
  ): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .rpc('withdraw_consent', {
          p_user_id: userId,
          p_consent_type: consentType,
          p_withdrawal_reason: withdrawalReason
        })

      if (error) throw error
      return data || false
    } catch (error) {
      console.error('Error withdrawing consent:', error)
      return false
    }
  }

  /**
   * Get all consents for a user
   */
  async getUserConsents(userId: string): Promise<UserConsent[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_consents')
        .select('*')
        .eq('user_id', userId)
        .order('granted_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching user consents:', error)
      return []
    }
  }

  /**
   * Grant multiple consents at once (for wizard completion)
   */
  async grantMultipleConsents(
    userId: string, 
    consents: ConsentRequest[]
  ): Promise<UserConsent[]> {
    const results: UserConsent[] = []

    for (const consent of consents) {
      const result = await this.grantConsent(userId, consent)
      if (result) {
        results.push(result)
      }
    }

    return results
  }

  /**
   * Check if user has all required consents for application type
   */
  async checkRequiredConsents(
    userId: string, 
    applicationType: 'kita' | 'elterngeld'
  ): Promise<{ hasAllRequired: boolean; missingConsents: string[] }> {
    const requiredConsents = [
      'data_processing',
      'child_data',
      'financial_data'
    ]

    const missingConsents: string[] = []

    for (const consentType of requiredConsents) {
      const result = await this.checkConsent(userId, consentType, applicationType)
      if (!result.hasConsent) {
        missingConsents.push(consentType)
      }
    }

    return {
      hasAllRequired: missingConsents.length === 0,
      missingConsents
    }
  }

  /**
   * Get consent summary for dashboard
   */
  async getConsentSummary(userId: string): Promise<{
    totalConsents: number
    activeConsents: number
    withdrawnConsents: number
    expiredConsents: number
    lastActivity: string | null
  }> {
    try {
      const consents = await this.getUserConsents(userId)
      
      const activeConsents = consents.filter(c => c.status === 'GRANTED').length
      const withdrawnConsents = consents.filter(c => c.status === 'WITHDRAWN').length
      const expiredConsents = consents.filter(c => c.status === 'EXPIRED').length
      
      const lastActivity = consents.length > 0 
        ? consents[0].updated_at 
        : null

      return {
        totalConsents: consents.length,
        activeConsents,
        withdrawnConsents,
        expiredConsents,
        lastActivity
      }
    } catch (error) {
      console.error('Error getting consent summary:', error)
      return {
        totalConsents: 0,
        activeConsents: 0,
        withdrawnConsents: 0,
        expiredConsents: 0,
        lastActivity: null
      }
    }
  }
} 