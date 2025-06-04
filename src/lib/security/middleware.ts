/**
 * GDPR-compliant security middleware
 * Handles authentication, authorization, audit logging, and breach detection
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sessionManager } from './session-manager'
import { encryptionService } from './encryption'

export interface SecurityContext {
  userId?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  roles: string[]
  permissions: DataAccessPermission[]
  isAuthenticated: boolean
  isAuthorized: boolean
  securityScore: number
}

export interface DataAccessPermission {
  tableName: string
  accessLevel: 'READ' | 'WRITE' | 'DELETE' | 'ADMIN'
  dataCategory: 'PERSONAL' | 'SPECIAL_CHILD' | 'FINANCIAL' | 'DOCUMENT' | 'COMMUNICATION'
  conditions?: Record<string, any>
}

export interface SecurityEvent {
  type: 'LOGIN' | 'LOGOUT' | 'ACCESS_DENIED' | 'SUSPICIOUS_ACTIVITY' | 'DATA_BREACH' | 'RATE_LIMIT'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  userId?: string
  sessionId?: string
  details: string
  metadata?: Record<string, any>
}

export class SecurityMiddleware {
  private readonly supabase = createClient()
  private readonly rateLimitMap = new Map<string, { count: number; resetTime: number }>()
  
  // Rate limiting configuration
  private readonly rateLimits = {
    login: { requests: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
    api: { requests: 100, windowMs: 60 * 1000 }, // 100 requests per minute
    sensitive: { requests: 10, windowMs: 60 * 1000 }, // 10 sensitive operations per minute
  }

  /**
   * Main security middleware function
   */
  async processRequest(request: NextRequest): Promise<{
    context: SecurityContext
    response?: NextResponse
  }> {
    const ipAddress = this.getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const path = request.nextUrl.pathname
    const method = request.method

    // Initialize security context
    let context: SecurityContext = {
      userId: undefined,
      sessionId: undefined,
      ipAddress,
      userAgent,
      roles: [],
      permissions: [],
      isAuthenticated: false,
      isAuthorized: false,
      securityScore: 100
    }

    try {
      // 1. Rate limiting check
      const rateLimitResponse = await this.checkRateLimit(request, ipAddress)
      if (rateLimitResponse) {
        await this.logSecurityEvent({
          type: 'RATE_LIMIT',
          severity: 'MEDIUM',
          details: `Rate limit exceeded for ${ipAddress}`,
          metadata: { path, method, ipAddress }
        })
        return { context, response: rateLimitResponse }
      }

      // 2. Session validation
      context = await this.validateSession(request, context)

      // 3. Authorization check for protected routes
      if (this.isProtectedRoute(path)) {
        if (!context.isAuthenticated) {
          return { 
            context, 
            response: NextResponse.redirect(new URL('/auth/login', request.url))
          }
        }

        const authorizationResult = await this.checkAuthorization(context, path, method)
        if (!authorizationResult.authorized) {
          await this.logSecurityEvent({
            type: 'ACCESS_DENIED',
            severity: 'HIGH',
            userId: context.userId,
            sessionId: context.sessionId,
            details: `Unauthorized access attempt to ${path}`,
            metadata: { path, method, reason: authorizationResult.reason }
          })
          
          return {
            context,
            response: new NextResponse('Forbidden', { status: 403 })
          }
        }
        
        context.isAuthorized = true
      }

      // 4. Suspicious activity detection
      await this.detectSuspiciousActivity(context, request)

      // 5. Audit logging for sensitive operations
      if (this.isSensitiveOperation(path, method)) {
        await this.logAuditEvent(context, path, method, request)
      }

      return { context }

    } catch (error) {
      console.error('Security middleware error:', error)
      
      await this.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'HIGH',
        details: `Security middleware error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: { path, method, ipAddress, error: String(error) }
      })

      return {
        context,
        response: new NextResponse('Internal Server Error', { status: 500 })
      }
    }
  }

  /**
   * Validate user session and build security context
   */
  private async validateSession(request: NextRequest, context: SecurityContext): Promise<SecurityContext> {
    const sessionToken = request.cookies.get('session_token')?.value
    const authHeader = request.headers.get('authorization')
    
    if (!sessionToken && !authHeader) {
      return context
    }

    try {
      // Validate with Supabase Auth
      const { data: { user }, error } = await this.supabase.auth.getUser(
        authHeader?.replace('Bearer ', '') || sessionToken
      )

      if (error || !user) {
        return context
      }

      // Validate custom session if session token provided
      if (sessionToken) {
        const session = await sessionManager.validateSession(
          sessionToken,
          context.ipAddress,
          context.userAgent
        )

        if (!session) {
          return context
        }

        context.sessionId = session.sessionId
      }

      // Load user roles and permissions
      const [roles, permissions] = await Promise.all([
        this.loadUserRoles(user.id),
        this.loadUserPermissions(user.id)
      ])

      context.userId = user.id
      context.roles = roles
      context.permissions = permissions
      context.isAuthenticated = true
      context.securityScore = await this.calculateSecurityScore(context)

      return context

    } catch (error) {
      console.error('Session validation error:', error)
      return context
    }
  }

  /**
   * Check user authorization for specific resource
   */
  private async checkAuthorization(
    context: SecurityContext, 
    path: string, 
    method: string
  ): Promise<{ authorized: boolean; reason?: string }> {
    // Admin users have full access
    if (context.roles.includes('ADMIN')) {
      return { authorized: true }
    }

    // Check specific route permissions
    const requiredPermission = this.getRequiredPermission(path, method)
    if (!requiredPermission) {
      return { authorized: true } // No specific permission required
    }

    // Check if user has required permission
    const hasPermission = context.permissions.some(p => 
      p.tableName === requiredPermission.table &&
      this.hasAccessLevel(p.accessLevel, requiredPermission.level) &&
      p.dataCategory === requiredPermission.category
    )

    if (!hasPermission) {
      return { 
        authorized: false, 
        reason: `Missing ${requiredPermission.level} permission for ${requiredPermission.table}` 
      }
    }

    return { authorized: true }
  }

  /**
   * Rate limiting implementation
   */
  private async checkRateLimit(request: NextRequest, ipAddress: string): Promise<NextResponse | null> {
    const path = request.nextUrl.pathname
    const method = request.method
    
    // Determine rate limit type
    let limitType: keyof typeof this.rateLimits = 'api'
    if (path.includes('/auth/login')) {
      limitType = 'login'
    } else if (this.isSensitiveOperation(path, method)) {
      limitType = 'sensitive'
    }

    const limit = this.rateLimits[limitType]
    const key = `${ipAddress}:${limitType}`
    const now = Date.now()

    const current = this.rateLimitMap.get(key)
    
    if (!current || now > current.resetTime) {
      // Reset or initialize counter
      this.rateLimitMap.set(key, { count: 1, resetTime: now + limit.windowMs })
      return null
    }

    if (current.count >= limit.requests) {
      // Rate limit exceeded
      return new NextResponse('Rate limit exceeded', { 
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((current.resetTime - now) / 1000))
        }
      })
    }

    // Increment counter
    current.count++
    return null
  }

  /**
   * Detect suspicious activity patterns
   */
  private async detectSuspiciousActivity(context: SecurityContext, request: NextRequest): Promise<void> {
    if (!context.isAuthenticated || !context.userId) return

    const suspiciousPatterns = []

    // Check for rapid requests from same IP
    const rapidRequests = await this.checkRapidRequests(context.ipAddress!)
    if (rapidRequests > 50) {
      suspiciousPatterns.push(`Rapid requests: ${rapidRequests}/minute`)
    }

    // Check for unusual access patterns
    const unusualAccess = await this.checkUnusualAccessPatterns(context.userId)
    if (unusualAccess.length > 0) {
      suspiciousPatterns.push(`Unusual access: ${unusualAccess.join(', ')}`)
    }

    // Check for session anomalies
    if (context.securityScore < 50) {
      suspiciousPatterns.push(`Low security score: ${context.securityScore}`)
    }

    // Log suspicious activity if detected
    if (suspiciousPatterns.length > 0) {
      await this.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'MEDIUM',
        userId: context.userId,
        sessionId: context.sessionId,
        details: `Suspicious patterns detected: ${suspiciousPatterns.join('; ')}`,
        metadata: {
          patterns: suspiciousPatterns,
          securityScore: context.securityScore,
          path: request.nextUrl.pathname
        }
      })
    }
  }

  /**
   * Calculate security score based on various factors
   */
  private async calculateSecurityScore(context: SecurityContext): Promise<number> {
    let score = 100

    // Deduct points for various risk factors
    if (!context.sessionId) score -= 20 // No session management
    if (context.ipAddress && await this.isHighRiskIP(context.ipAddress)) score -= 30
    if (!context.userAgent || context.userAgent === 'unknown') score -= 10

    // Check recent security incidents
    const recentIncidents = await this.getRecentSecurityIncidents(context.userId!)
    score -= recentIncidents * 10

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Load user roles from database
   */
  private async loadUserRoles(userId: string): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())

      if (error) throw error
      return data?.map(r => r.role) || ['USER']
    } catch (error) {
      console.error('Error loading user roles:', error)
      return ['USER']
    }
  }

  /**
   * Load user permissions from database
   */
  private async loadUserPermissions(userId: string): Promise<DataAccessPermission[]> {
    try {
      const { data, error } = await this.supabase
        .from('data_access_permissions')
        .select('table_name, access_level, data_category, conditions')
        .eq('user_id', userId)
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())

      if (error) throw error
      
      return data?.map(p => ({
        tableName: p.table_name,
        accessLevel: p.access_level,
        dataCategory: p.data_category,
        conditions: p.conditions
      })) || []
    } catch (error) {
      console.error('Error loading user permissions:', error)
      return []
    }
  }

  /**
   * Check if user has required access level
   */
  private hasAccessLevel(userLevel: string, requiredLevel: string): boolean {
    const levels = ['READ', 'WRITE', 'DELETE', 'ADMIN']
    const userIndex = levels.indexOf(userLevel)
    const requiredIndex = levels.indexOf(requiredLevel)
    return userIndex >= requiredIndex
  }

  /**
   * Determine required permission for route
   */
  private getRequiredPermission(path: string, method: string): {
    table: string
    level: string
    category: string
  } | null {
    // API routes that require specific permissions
    if (path.startsWith('/api/')) {
      if (path.includes('/parents')) {
        return {
          table: 'parents',
          level: method === 'GET' ? 'READ' : method === 'DELETE' ? 'DELETE' : 'WRITE',
          category: 'PERSONAL'
        }
      }
      if (path.includes('/children')) {
        return {
          table: 'children',
          level: method === 'GET' ? 'READ' : method === 'DELETE' ? 'DELETE' : 'WRITE',
          category: 'SPECIAL_CHILD'
        }
      }
      // Add more route-specific permissions as needed
    }

    return null
  }

  /**
   * Check if route is protected
   */
  private isProtectedRoute(path: string): boolean {
    const protectedPaths = [
      '/dashboard',
      '/kita-gutschein',
      '/elterngeld',
      '/api/protected',
      '/api/applications',
      '/api/documents'
    ]
    
    return protectedPaths.some(protectedPath => path.startsWith(protectedPath))
  }

  /**
   * Check if operation is sensitive
   */
  private isSensitiveOperation(path: string, method: string): boolean {
    // Data modification operations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return true
    }

    // Sensitive read operations
    const sensitiveReadPaths = [
      '/api/personal-data',
      '/api/audit-logs',
      '/api/export',
      '/dashboard'
    ]

    return sensitiveReadPaths.some(sensitive => path.startsWith(sensitive))
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    if (realIP) {
      return realIP
    }

    return 'unknown'
  }

  /**
   * Log security events to database
   */
  private async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('security_incidents')
        .insert({
          incident_type: event.type.toLowerCase(),
          severity: event.severity,
          user_id: event.userId,
          session_id: event.sessionId,
          description: event.details,
          details: event.metadata
        })

      if (error) {
        console.error('Failed to log security event:', error)
      }

      // Auto-escalate critical events
      if (event.severity === 'CRITICAL') {
        await this.escalateCriticalEvent(event)
      }

    } catch (error) {
      console.error('Security event logging error:', error)
    }
  }

  /**
   * Log audit events for compliance
   */
  private async logAuditEvent(
    context: SecurityContext, 
    path: string, 
    method: string, 
    request: NextRequest
  ): Promise<void> {
    try {
      await this.supabase
        .from('audit_logs')
        .insert({
          user_id: context.userId,
          table_name: this.extractTableFromPath(path),
          action: method,
          data_category: 'PERSONAL',
          purpose: 'User data access',
          legal_basis: 'Art. 6.1.a GDPR (Consent)',
          ip_address: context.ipAddress,
          user_agent: context.userAgent,
          session_id: context.sessionId
        })
    } catch (error) {
      console.error('Audit logging error:', error)
    }
  }

  /**
   * Extract table name from API path
   */
  private extractTableFromPath(path: string): string {
    if (path.includes('/parents')) return 'parents'
    if (path.includes('/children')) return 'children'
    if (path.includes('/employment')) return 'employment_records'
    if (path.includes('/documents')) return 'documents'
    if (path.includes('/consents')) return 'user_consents'
    return 'unknown'
  }

  /**
   * Helper methods for suspicious activity detection
   */
  private async checkRapidRequests(ipAddress: string): Promise<number> {
    // Implementation would check request logs for rapid requests
    return 0 // Placeholder
  }

  private async checkUnusualAccessPatterns(userId: string): Promise<string[]> {
    // Implementation would analyze user's typical access patterns
    return [] // Placeholder
  }

  private async isHighRiskIP(ipAddress: string): Promise<boolean> {
    // Implementation would check against threat intelligence feeds
    return false // Placeholder
  }

  private async getRecentSecurityIncidents(userId: string): Promise<number> {
    try {
      const { count } = await this.supabase
        .from('security_incidents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      return count || 0
    } catch {
      return 0
    }
  }

  private async escalateCriticalEvent(event: SecurityEvent): Promise<void> {
    // Implementation would notify security team/DPO
    console.error('CRITICAL SECURITY EVENT:', event)
  }
}

// Singleton instance
export const securityMiddleware = new SecurityMiddleware()

// Helper function for Next.js middleware
export function createSecurityMiddleware() {
  return async (request: NextRequest) => {
    const result = await securityMiddleware.processRequest(request)
    
    if (result.response) {
      return result.response
    }

    // Attach security context to request headers for downstream use
    const response = NextResponse.next()
    response.headers.set('X-Security-Context', JSON.stringify({
      userId: result.context.userId,
      isAuthenticated: result.context.isAuthenticated,
      isAuthorized: result.context.isAuthorized,
      securityScore: result.context.securityScore
    }))

    return response
  }
} 