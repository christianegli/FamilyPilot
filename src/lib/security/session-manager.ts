/**
 * GDPR-compliant session management with security controls
 * Implements secure session handling, timeouts, and audit logging
 */

import { createClient } from '@/lib/supabase/client'
import { encryptionService } from './encryption'

export interface SessionInfo {
  sessionId: string
  userId: string
  createdAt: Date
  lastActivity: Date
  expiresAt: Date
  ipAddress?: string
  userAgent?: string
  isActive: boolean
  loginMethod: 'email' | 'social' | 'mfa'
}

export interface SecurityEvent {
  type: 'login' | 'logout' | 'timeout' | 'suspicious_activity' | 'session_hijack'
  sessionId: string
  userId?: string
  ipAddress?: string
  userAgent?: string
  details?: string
  timestamp: Date
}

export class SessionManager {
  private readonly supabase = createClient()
  private readonly maxSessionDuration = 24 * 60 * 60 * 1000 // 24 hours
  private readonly inactivityTimeout = 8 * 60 * 60 * 1000 // 8 hours
  private readonly maxConcurrentSessions = 3 // Maximum concurrent sessions per user

  /**
   * Create new secure session
   */
  async createSession(userId: string, ipAddress?: string, userAgent?: string): Promise<SessionInfo> {
    try {
      // Check for existing sessions and enforce limits
      await this.enforceSessionLimits(userId)

      const sessionId = encryptionService.generateSecureToken(32)
      const now = new Date()
      const expiresAt = new Date(now.getTime() + this.maxSessionDuration)

      const sessionInfo: SessionInfo = {
        sessionId,
        userId,
        createdAt: now,
        lastActivity: now,
        expiresAt,
        ipAddress,
        userAgent,
        isActive: true,
        loginMethod: 'email' // Default, should be passed from auth
      }

      // Store session in encrypted format
      await this.storeSession(sessionInfo)

      // Log security event
      await this.logSecurityEvent({
        type: 'login',
        sessionId,
        userId,
        ipAddress,
        userAgent,
        timestamp: now
      })

      return sessionInfo
    } catch (error) {
      throw new Error(`Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Validate and refresh session
   */
  async validateSession(sessionId: string, ipAddress?: string, userAgent?: string): Promise<SessionInfo | null> {
    try {
      const session = await this.getSession(sessionId)
      
      if (!session) {
        return null
      }

      const now = new Date()

      // Check if session expired
      if (now > session.expiresAt) {
        await this.destroySession(sessionId, 'timeout')
        return null
      }

      // Check inactivity timeout
      const inactiveTime = now.getTime() - session.lastActivity.getTime()
      if (inactiveTime > this.inactivityTimeout) {
        await this.destroySession(sessionId, 'timeout')
        return null
      }

      // Security checks
      const securityIssue = await this.checkSecurityAnomalies(session, ipAddress, userAgent)
      if (securityIssue) {
        await this.destroySession(sessionId, 'suspicious_activity')
        await this.logSecurityEvent({
          type: 'suspicious_activity',
          sessionId,
          userId: session.userId,
          ipAddress,
          userAgent,
          details: securityIssue,
          timestamp: now
        })
        return null
      }

      // Update last activity
      session.lastActivity = now
      await this.updateSession(session)

      return session
    } catch (error) {
      console.error('Session validation error:', error)
      return null
    }
  }

  /**
   * Destroy session securely
   */
  async destroySession(sessionId: string, reason: 'logout' | 'timeout' | 'suspicious_activity'): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId)
      
      if (session) {
        // Mark session as inactive
        session.isActive = false
        await this.updateSession(session)

        // Log security event
        await this.logSecurityEvent({
          type: reason === 'logout' ? 'logout' : reason,
          sessionId,
          userId: session.userId,
          timestamp: new Date()
        })

        // Remove from active sessions storage
        await this.removeSession(sessionId)
      }

      return true
    } catch (error) {
      console.error('Failed to destroy session:', error)
      return false
    }
  }

  /**
   * Get all active sessions for user
   */
  async getUserSessions(userId: string): Promise<SessionInfo[]> {
    try {
      const { data: sessions, error } = await this.supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_activity', { ascending: false })

      if (error) throw error

      return sessions?.map(this.parseSessionFromDb) || []
    } catch (error) {
      console.error('Failed to get user sessions:', error)
      return []
    }
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const now = new Date()
      
      const { data: expiredSessions, error: fetchError } = await this.supabase
        .from('user_sessions')
        .select('session_id, user_id')
        .or(`expires_at.lt.${now.toISOString()},last_activity.lt.${new Date(now.getTime() - this.inactivityTimeout).toISOString()}`)
        .eq('is_active', true)

      if (fetchError) throw fetchError

      let cleanedCount = 0
      
      for (const session of expiredSessions || []) {
        await this.destroySession(session.session_id, 'timeout')
        cleanedCount++
      }

      return cleanedCount
    } catch (error) {
      console.error('Session cleanup error:', error)
      return 0
    }
  }

  /**
   * Force logout all sessions for user
   */
  async logoutAllSessions(userId: string, excludeSessionId?: string): Promise<number> {
    try {
      const sessions = await this.getUserSessions(userId)
      let loggedOutCount = 0

      for (const session of sessions) {
        if (session.sessionId !== excludeSessionId) {
          await this.destroySession(session.sessionId, 'logout')
          loggedOutCount++
        }
      }

      return loggedOutCount
    } catch (error) {
      console.error('Failed to logout all sessions:', error)
      return 0
    }
  }

  /**
   * Check for security anomalies
   */
  private async checkSecurityAnomalies(
    session: SessionInfo, 
    currentIp?: string, 
    currentUserAgent?: string
  ): Promise<string | null> {
    // IP address change detection
    if (session.ipAddress && currentIp && session.ipAddress !== currentIp) {
      return `IP address change: ${session.ipAddress} -> ${currentIp}`
    }

    // User agent change detection (simplified)
    if (session.userAgent && currentUserAgent) {
      const sessionUA = session.userAgent.toLowerCase()
      const currentUA = currentUserAgent.toLowerCase()
      
      // Check for major browser/OS changes
      const sessionBrowser = this.extractBrowser(sessionUA)
      const currentBrowser = this.extractBrowser(currentUA)
      
      if (sessionBrowser !== currentBrowser) {
        return `Browser change detected: ${sessionBrowser} -> ${currentBrowser}`
      }
    }

    return null
  }

  /**
   * Extract browser type from user agent
   */
  private extractBrowser(userAgent: string): string {
    if (userAgent.includes('chrome')) return 'chrome'
    if (userAgent.includes('firefox')) return 'firefox'
    if (userAgent.includes('safari')) return 'safari'
    if (userAgent.includes('edge')) return 'edge'
    return 'unknown'
  }

  /**
   * Enforce session limits per user
   */
  private async enforceSessionLimits(userId: string): Promise<void> {
    const sessions = await this.getUserSessions(userId)
    
    if (sessions.length >= this.maxConcurrentSessions) {
      // Remove oldest sessions
      const sessionsToRemove = sessions
        .sort((a, b) => a.lastActivity.getTime() - b.lastActivity.getTime())
        .slice(0, sessions.length - this.maxConcurrentSessions + 1)

      for (const session of sessionsToRemove) {
        await this.destroySession(session.sessionId, 'logout')
      }
    }
  }

  /**
   * Store session securely in database
   */
  private async storeSession(session: SessionInfo): Promise<void> {
    const { error } = await this.supabase
      .from('user_sessions')
      .insert({
        session_id: session.sessionId,
        user_id: session.userId,
        created_at: session.createdAt.toISOString(),
        last_activity: session.lastActivity.toISOString(),
        expires_at: session.expiresAt.toISOString(),
        ip_address: session.ipAddress,
        user_agent: session.userAgent,
        is_active: session.isActive,
        login_method: session.loginMethod
      })

    if (error) throw error
  }

  /**
   * Get session from database
   */
  private async getSession(sessionId: string): Promise<SessionInfo | null> {
    const { data, error } = await this.supabase
      .from('user_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('is_active', true)
      .single()

    if (error || !data) return null

    return this.parseSessionFromDb(data)
  }

  /**
   * Update session in database
   */
  private async updateSession(session: SessionInfo): Promise<void> {
    const { error } = await this.supabase
      .from('user_sessions')
      .update({
        last_activity: session.lastActivity.toISOString(),
        is_active: session.isActive
      })
      .eq('session_id', session.sessionId)

    if (error) throw error
  }

  /**
   * Remove session from database
   */
  private async removeSession(sessionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_sessions')
      .delete()
      .eq('session_id', sessionId)

    if (error) throw error
  }

  /**
   * Parse session data from database
   */
  private parseSessionFromDb(data: any): SessionInfo {
    return {
      sessionId: data.session_id,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      lastActivity: new Date(data.last_activity),
      expiresAt: new Date(data.expires_at),
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      isActive: data.is_active,
      loginMethod: data.login_method
    }
  }

  /**
   * Log security events for audit trail
   */
  private async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('audit_logs')
        .insert({
          user_id: event.userId,
          table_name: 'user_sessions',
          action: event.type.toUpperCase(),
          data_category: 'PERSONAL',
          purpose: 'Session security monitoring',
          legal_basis: 'Art. 6.1.f GDPR (Legitimate interest)',
          ip_address: event.ipAddress,
          user_agent: event.userAgent,
          session_id: event.sessionId
        })

      if (error) {
        console.error('Failed to log security event:', error)
      }
    } catch (error) {
      console.error('Security event logging error:', error)
    }
  }
}

// Singleton instance
export const sessionManager = new SessionManager() 