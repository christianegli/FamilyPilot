/**
 * GDPR-compliant encryption service for sensitive personal data
 * Implements AES-256 encryption for field-level data protection
 */

import * as crypto from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(crypto.scrypt)

export interface EncryptedData {
  data: string
  iv: string
  salt: string
  tag: string
}

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm' as const
  private readonly keyLength = 32
  private readonly ivLength = 16
  private readonly saltLength = 16
  private readonly tagLength = 16

  /**
   * Derive encryption key from password and salt
   */
  private async deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    return (await scryptAsync(password, salt, this.keyLength)) as Buffer
  }

  /**
   * Get encryption password from environment
   * In production, this should be stored in a secure key management service
   */
  private getEncryptionPassword(): string {
    const password = process.env.ENCRYPTION_KEY
    if (!password) {
      throw new Error('ENCRYPTION_KEY environment variable is required')
    }
    return password
  }

  /**
   * Encrypt sensitive data field
   */
  async encryptField(data: string): Promise<EncryptedData> {
    try {
      const password = this.getEncryptionPassword()
      const salt = crypto.randomBytes(this.saltLength)
      const iv = crypto.randomBytes(this.ivLength)
      const key = await this.deriveKey(password, salt)

      const cipher = crypto.createCipheriv(this.algorithm, key, iv)
      let encrypted = cipher.update(data, 'utf8', 'hex')
      encrypted += cipher.final('hex')

      const tag = cipher.getAuthTag()

      return {
        data: encrypted,
        iv: iv.toString('hex'),
        salt: salt.toString('hex'),
        tag: tag.toString('hex')
      }
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Decrypt sensitive data field
   */
  async decryptField(encryptedData: EncryptedData): Promise<string> {
    try {
      const password = this.getEncryptionPassword()
      const salt = Buffer.from(encryptedData.salt, 'hex')
      const iv = Buffer.from(encryptedData.iv, 'hex')
      const tag = Buffer.from(encryptedData.tag, 'hex')
      const key = await this.deriveKey(password, salt)

      const decipher = crypto.createDecipheriv(this.algorithm, key, iv)
      decipher.setAuthTag(tag)

      let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return decrypted
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Hash sensitive data for search/comparison purposes
   * Uses SHA-256 with salt for one-way hashing
   */
  async hashForSearch(data: string): Promise<string> {
    const salt = process.env.SEARCH_SALT || 'default-salt-change-in-production'
    return crypto.createHash('sha256').update(data + salt).digest('hex')
  }

  /**
   * Encrypt personal data object with field-level encryption
   */
  async encryptPersonalData(data: Record<string, any>): Promise<Record<string, any>> {
    const encrypted: Record<string, any> = {}
    
    // Define which fields need encryption
    const sensitiveFields = [
      'first_name', 'last_name', 'email', 'telefon', 'strasse', 'hausnummer',
      'arbeitgeber', 'netto_monat_einkommen', 'jahreseinkommen_vor_geburt',
      'partner_name', 'besondere_umstaende', 'besondere_beduerfnisse'
    ]

    for (const [key, value] of Object.entries(data)) {
      if (sensitiveFields.includes(key) && typeof value === 'string' && value.trim()) {
        encrypted[key] = await this.encryptField(value)
        encrypted[`${key}_encrypted`] = true
      } else {
        encrypted[key] = value
      }
    }

    return encrypted
  }

  /**
   * Decrypt personal data object
   */
  async decryptPersonalData(data: Record<string, any>): Promise<Record<string, any>> {
    const decrypted: Record<string, any> = {}

    for (const [key, value] of Object.entries(data)) {
      if (key.endsWith('_encrypted')) {
        // Skip encryption flag fields
        continue
      }

      if (data[`${key}_encrypted`] && typeof value === 'object' && value !== null) {
        try {
          decrypted[key] = await this.decryptField(value as EncryptedData)
        } catch (error) {
          console.error(`Failed to decrypt field ${key}:`, error)
          decrypted[key] = '[DECRYPTION_ERROR]'
        }
      } else {
        decrypted[key] = value
      }
    }

    return decrypted
  }

  /**
   * Generate secure random token for session management
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  /**
   * Validate encryption configuration
   */
  validateConfiguration(): boolean {
    try {
      const password = this.getEncryptionPassword()
      return password.length >= 32 // Minimum 32 characters for strong encryption
    } catch {
      return false
    }
  }
}

// Singleton instance
export const encryptionService = new EncryptionService()

// Type definitions for encrypted fields
export type EncryptableField = 
  | 'first_name' 
  | 'last_name' 
  | 'email' 
  | 'telefon' 
  | 'strasse' 
  | 'hausnummer'
  | 'arbeitgeber' 
  | 'netto_monat_einkommen' 
  | 'jahreseinkommen_vor_geburt'
  | 'partner_name' 
  | 'besondere_umstaende' 
  | 'besondere_beduerfnisse'

export interface EncryptionAuditLog {
  field: string
  operation: 'encrypt' | 'decrypt'
  userId?: string
  timestamp: Date
  success: boolean
  error?: string
} 