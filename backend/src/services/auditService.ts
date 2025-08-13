import prisma from '../utils/db';
import { AuditAction, GDPRAction, Role } from '@prisma/client';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface AuditQuery {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  ipAddress?: string;
  page?: number;
  limit?: number;
}

export interface PatientAccessReport {
  patientId: string;
  patientName: string;
  accessCount: number;
  lastAccessed: Date;
  accessedBy: Array<{
    userId: string;
    userName: string;
    role: string;
    accessCount: number;
    lastAccessed: Date;
  }>;
}

export interface SystemActivitySummary {
  totalActions: number;
  uniqueUsers: number;
  topActions: Array<{
    action: string;
    count: number;
  }>;
  hourlyDistribution: Array<{
    hour: number;
    count: number;
  }>;
  userActivity: Array<{
    userId: string;
    userName: string;
    role: string;
    actionCount: number;
    lastActivity: Date;
  }>;
}

export interface SecurityEvent {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  userId?: string;
  userName?: string;
  ipAddress?: string;
  timestamp: Date;
  details: any;
}

// Legacy AuditLogData interface for backward compatibility
interface AuditLogData {
  userId: string;
  action: AuditAction;
  tableName: string;
  recordId: string;
  oldValues?: any;
  newValues?: any;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
}

class EnhancedAuditService {
  // Legacy methods for backward compatibility
  static async createAuditLog(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({ data });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  static getUserFromRequest(req: Request): { userId: string; ipAddress?: string; userAgent?: string } {
    const user = (req as any).user;
    if (!user?.id) {
      throw new Error('User not found in request. Make sure authentication middleware is applied.');
    }

    return {
      userId: user.id,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
    };
  }

  static async logCreate(req: Request, tableName: string, recordId: string, newValues: any, description?: string): Promise<void> {
    try {
      const { userId, ipAddress, userAgent } = this.getUserFromRequest(req);
      await this.createAuditLog({
        userId,
        action: AuditAction.CREATE,
        tableName,
        recordId,
        newValues,
        description: description || `Created ${tableName} record`,
        ipAddress,
        userAgent,
      });
    } catch (error) {
      console.error('Audit logging failed for CREATE:', error);
    }
  }

  static async logUpdate(req: Request, tableName: string, recordId: string, oldValues: any, newValues: any, description?: string): Promise<void> {
    try {
      const { userId, ipAddress, userAgent } = this.getUserFromRequest(req);
      await this.createAuditLog({
        userId,
        action: AuditAction.UPDATE,
        tableName,
        recordId,
        oldValues,
        newValues,
        description: description || `Updated ${tableName} record`,
        ipAddress,
        userAgent,
      });
    } catch (error) {
      console.error('Audit logging failed for UPDATE:', error);
    }
  }

  static async logDelete(req: Request, tableName: string, recordId: string, oldValues: any, description?: string): Promise<void> {
    try {
      const { userId, ipAddress, userAgent } = this.getUserFromRequest(req);
      await this.createAuditLog({
        userId,
        action: AuditAction.DELETE,
        tableName,
        recordId,
        oldValues,
        description: description || `Deleted ${tableName} record`,
        ipAddress,
        userAgent,
      });
    } catch (error) {
      console.error('Audit logging failed for DELETE:', error);
    }
  }

  static cleanSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') return data;
    const cleaned = { ...data };
    const sensitiveFields = ['password', 'resetPasswordToken', 'emailVerificationToken', 'refreshToken'];
    for (const field of sensitiveFields) {
      if (cleaned[field]) {
        cleaned[field] = '[REDACTED]';
      }
    }
    return cleaned;
  }

  // Enhanced audit logging methods
  async getAuditLogs(query: AuditQuery) {
    const {
      startDate,
      endDate,
      userId,
      action,
      resource,
      resourceId,
      ipAddress,
      page = 1,
      limit = 50
    } = query;

    const where: any = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate
      };
    }

    if (userId) where.userId = userId;
    if (action) where.action = action as AuditAction;
    if (resource) where.tableName = { contains: resource, mode: 'insensitive' };
    if (resourceId) where.recordId = resourceId;
    if (ipAddress) where.ipAddress = { contains: ipAddress };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.auditLog.count({ where })
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getGDPRAuditLogs(query: AuditQuery) {
    const {
      startDate,
      endDate,
      userId,
      action,
      resourceId,
      page = 1,
      limit = 50
    } = query;

    const where: any = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate
      };
    }

    if (userId) where.userId = userId;
    if (action) where.action = action as GDPRAction;
    if (resourceId) where.recordId = resourceId;

    const [logs, total] = await Promise.all([
      prisma.gDPRAuditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.gDPRAuditLog.count({ where })
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getPatientAccessReport(patientId?: string, days: number = 30): Promise<PatientAccessReport[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get comprehensive patient access data from both GDPR logs and detailed audit logs
    const [gdprLogs, detailedAuditLogs] = await Promise.all([
      prisma.gDPRAuditLog.findMany({
        where: {
          createdAt: { gte: startDate },
          action: 'DATA_ACCESS',
          dataType: { contains: 'patient' },
          ...(patientId && { recordId: patientId })
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.auditLog.findMany({
        where: {
          createdAt: { gte: startDate },
          action: { in: ['VIEW_DETAILED', 'VIEW_LIST'] },
          tableName: { in: ['patients', 'patient_history'] },
          ...(patientId && { recordId: patientId })
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      })
    ]);

    // Combine and deduplicate logs by grouping into sessions
    const allLogs = [
      ...gdprLogs.map(log => ({ ...log, source: 'gdpr' })),
      ...detailedAuditLogs.map(log => {
        const patientId = this.extractPatientIdFromAuditLog(log);
        return { ...log, recordId: patientId || log.recordId, source: 'audit' };
      }).filter(log => log.recordId)
    ];
    
    const sessionGroups = this.groupLogsIntoSessions(allLogs);

    // Group by patient with session-based counting
    const patientAccess = new Map<string, any>();

    // Process each session group as a single access
    for (const sessionGroup of sessionGroups) {
      await this.processPatientAccessSession(sessionGroup, patientAccess);
    }

    // Convert to array and enrich with comprehensive data
    const result = await Promise.all(
      Array.from(patientAccess.values()).map(async (patient) => {
        const enrichedAccessors = await Promise.all(
          Array.from(patient.accessors.values()).map(async (accessor: any) => {
            // Get detailed access sessions for this user
            const accessSessions = await this.getDetailedAccessSessions(
              patient.patientId, 
              accessor.userId, 
              startDate
            );
            
            return {
              ...accessor,
              accessSessions,
              dataTypesAccessed: [...new Set(accessSessions.flatMap(s => s.dataTypesAccessed))],
              sensitiveDataAccessed: [...new Set(accessSessions.flatMap(s => s.sensitiveDataAccessed))],
              totalDuration: accessSessions.reduce((sum, s) => sum + (s.duration || 0), 0),
              averageDuration: accessSessions.length ? Math.round(accessSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / accessSessions.length) : 0
            };
          })
        );

        return {
          ...patient,
          accessedBy: enrichedAccessors,
          totalDataTypes: [...new Set(enrichedAccessors.flatMap(a => a.dataTypesAccessed))],
          totalSensitiveData: [...new Set(enrichedAccessors.flatMap(a => a.sensitiveDataAccessed))],
          accessSummary: this.generateAccessSummary(enrichedAccessors)
        };
      })
    );

    return result.sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime());
  }

  private groupLogsIntoSessions(logs: any[]): any[][] {
    const SESSION_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
    const sessionGroups: any[][] = [];
    const userPatientSessions = new Map<string, any[]>();

    // Sort logs by timestamp to process chronologically
    const sortedLogs = logs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    for (const log of sortedLogs) {
      if (!log.user || !log.recordId) continue;

      // Create unique key for user + patient combination
      const sessionKey = `${log.user.id}-${log.recordId}`;
      const logTime = new Date(log.createdAt).getTime();

      if (!userPatientSessions.has(sessionKey)) {
        userPatientSessions.set(sessionKey, []);
      }

      const userSessions = userPatientSessions.get(sessionKey)!;
      
      // Find if this log belongs to an existing session (within time window)
      let addedToSession = false;
      for (const session of userSessions) {
        const sessionStart = Math.min(...session.map((l: any) => new Date(l.createdAt).getTime()));
        const sessionEnd = Math.max(...session.map((l: any) => new Date(l.createdAt).getTime()));
        
        // If log is within 5 minutes of session start or end, add to session
        if (logTime >= sessionStart - SESSION_WINDOW_MS && logTime <= sessionEnd + SESSION_WINDOW_MS) {
          session.push(log);
          addedToSession = true;
          break;
        }
      }

      // If not added to existing session, create new session
      if (!addedToSession) {
        userSessions.push([log]);
      }
    }

    // Flatten all sessions into single array
    for (const userSessions of userPatientSessions.values()) {
      sessionGroups.push(...userSessions);
    }

    return sessionGroups;
  }

  private async processPatientAccessSession(sessionLogs: any[], patientAccess: Map<string, any>) {
    if (sessionLogs.length === 0) return;

    // Use the first log as representative for the session
    const representativeLog = sessionLogs[0];
    const patientKey = representativeLog.recordId;
    
    if (!patientAccess.has(patientKey)) {
      // Get patient information
      const patient = await prisma.patient.findUnique({
        where: { id: representativeLog.recordId },
        select: { 
          firstName: true, 
          lastName: true, 
          id: true,
          email: true,
          phone: true,
          dateOfBirth: true
        }
      });

      if (!patient) return;

      patientAccess.set(patientKey, {
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientEmail: patient.email,
        patientPhone: patient.phone,
        patientDOB: patient.dateOfBirth,
        accessCount: 0,
        lastAccessed: representativeLog.createdAt,
        accessors: new Map<string, any>(),
        firstAccessed: representativeLog.createdAt
      });
    }

    const patientData = patientAccess.get(patientKey);
    
    // Count this session as ONE access (regardless of how many logs in the session)
    patientData.accessCount++;
    
    // Update session timing
    const sessionTimes = sessionLogs.map(log => new Date(log.createdAt));
    const sessionStart = new Date(Math.min(...sessionTimes.map(t => t.getTime())));
    const sessionEnd = new Date(Math.max(...sessionTimes.map(t => t.getTime())));
    
    if (sessionEnd > new Date(patientData.lastAccessed)) {
      patientData.lastAccessed = sessionEnd;
    }
    if (sessionStart < new Date(patientData.firstAccessed)) {
      patientData.firstAccessed = sessionStart;
    }

    // Track individual user access within the session
    if (representativeLog.user) {
      const userKey = representativeLog.user.id;
      if (!patientData.accessors.has(userKey)) {
        patientData.accessors.set(userKey, {
          userId: representativeLog.user.id,
          userName: `${representativeLog.user.firstName} ${representativeLog.user.lastName}`,
          userEmail: representativeLog.user.email,
          role: representativeLog.user.role,
          accessCount: 0,
          lastAccessed: sessionEnd,
          firstAccessed: sessionStart,
          accessTypes: new Set(),
          ipAddresses: new Set(),
          userAgents: new Set()
        });
      }

      const userAccess = patientData.accessors.get(userKey);
      userAccess.accessCount++; // Count session as one access
      
      if (sessionEnd > new Date(userAccess.lastAccessed)) {
        userAccess.lastAccessed = sessionEnd;
      }
      if (sessionStart < new Date(userAccess.firstAccessed)) {
        userAccess.firstAccessed = sessionStart;
      }

      // Add access details from all logs in the session
      for (const log of sessionLogs) {
        if (log.ipAddress) userAccess.ipAddresses.add(log.ipAddress);
        if (log.userAgent) userAccess.userAgents.add(log.userAgent);
        if (log.newValues?.accessType) {
          userAccess.accessTypes.add(log.newValues.accessType);
        }
      }
    }
  }

  private async processPatientAccessLog(log: any, patientAccess: Map<string, any>, source: 'gdpr' | 'audit') {
    const patientKey = log.recordId;
    
    if (!patientAccess.has(patientKey)) {
      // Get patient information
      const patient = await prisma.patient.findUnique({
        where: { id: log.recordId },
        select: { 
          firstName: true, 
          lastName: true, 
          id: true,
          email: true,
          phone: true,
          dateOfBirth: true
        }
      });

      if (!patient) return;

      patientAccess.set(patientKey, {
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientEmail: patient.email,
        patientPhone: patient.phone,
        patientDOB: patient.dateOfBirth,
        accessCount: 0,
        lastAccessed: log.createdAt,
        accessors: new Map<string, any>(),
        firstAccessed: log.createdAt
      });
    }

    const patientData = patientAccess.get(patientKey);
    patientData.accessCount++;
    
    if (log.createdAt > patientData.lastAccessed) {
      patientData.lastAccessed = log.createdAt;
    }
    if (log.createdAt < patientData.firstAccessed) {
      patientData.firstAccessed = log.createdAt;
    }

    // Track individual user access
    if (log.user) {
      const userKey = log.user.id;
      if (!patientData.accessors.has(userKey)) {
        patientData.accessors.set(userKey, {
          userId: log.user.id,
          userName: `${log.user.firstName} ${log.user.lastName}`,
          userEmail: log.user.email,
          role: log.user.role,
          accessCount: 0,
          lastAccessed: log.createdAt,
          firstAccessed: log.createdAt,
          accessTypes: new Set(),
          ipAddresses: new Set(),
          userAgents: new Set()
        });
      }

      const userAccess = patientData.accessors.get(userKey);
      userAccess.accessCount++;
      if (log.createdAt > userAccess.lastAccessed) {
        userAccess.lastAccessed = log.createdAt;
      }
      if (log.createdAt < userAccess.firstAccessed) {
        userAccess.firstAccessed = log.createdAt;
      }

      // Add access details
      if (log.ipAddress) userAccess.ipAddresses.add(log.ipAddress);
      if (log.userAgent) userAccess.userAgents.add(log.userAgent);
      if (source === 'audit' && log.newValues?.accessType) {
        userAccess.accessTypes.add(log.newValues.accessType);
      }
    }
  }

  private extractPatientIdFromAuditLog(log: any): string | null {
    // Extract patient ID from audit log
    if (log.recordId && log.recordId !== 'list_view') {
      return log.recordId;
    }
    
    // Try to extract from newValues if available
    if (log.newValues?.patientInfo?.id) {
      return log.newValues.patientInfo.id;
    }
    
    return null;
  }

  private async getDetailedAccessSessions(patientId: string, userId: string, startDate: Date) {
    const sessions = await prisma.auditLog.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
        recordId: patientId,
        tableName: { in: ['patients', 'patient_history'] }
      },
      orderBy: { createdAt: 'desc' }
    });

    return sessions.map(session => ({
      sessionId: session.id,
      timestamp: session.createdAt,
      accessType: session.newValues?.accessType || 'unknown',
      dataTypesAccessed: session.newValues?.dataTypesAccessed || [],
      sensitiveDataAccessed: session.newValues?.sensitiveDataAccessed || [],
      duration: session.newValues?.duration ? parseInt(session.newValues.duration.replace('ms', '')) : null,
      responseSize: session.newValues?.responseSize || 'unknown',
      accessReason: session.newValues?.accessReason || 'Medical center operations',
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      success: session.newValues?.accessSuccess !== false
    }));
  }

  private generateAccessSummary(accessors: any[]) {
    const totalAccess = accessors.reduce((sum, a) => sum + a.accessCount, 0);
    const uniqueIPs = new Set(accessors.flatMap(a => Array.from(a.ipAddresses || []))).size;
    const roleDistribution = accessors.reduce((roles: any, a) => {
      roles[a.role] = (roles[a.role] || 0) + a.accessCount;
      return roles;
    }, {});

    return {
      totalAccess,
      uniqueUsers: accessors.length,
      uniqueIPs,
      roleDistribution,
      timeSpan: accessors.length ? {
        from: new Date(Math.min(...accessors.map(a => new Date(a.firstAccessed).getTime()))),
        to: new Date(Math.max(...accessors.map(a => new Date(a.lastAccessed).getTime())))
      } : null
    };
  }

  async getSystemActivitySummary(days: number = 7): Promise<SystemActivitySummary> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalActions, uniqueUsersResult, actionCounts, hourlyData, userActivity] = await Promise.all([
      prisma.auditLog.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.auditLog.findMany({
        where: { 
          createdAt: { gte: startDate },
          userId: { not: 'anonymous' }
        },
        distinct: ['userId'],
        select: { userId: true }
      }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where: { createdAt: { gte: startDate } },
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } }
      }),
      prisma.$queryRaw`
        SELECT 
          EXTRACT(hour FROM created_at) as hour,
          COUNT(*) as count
        FROM audit_logs 
        WHERE created_at >= ${startDate}
        GROUP BY EXTRACT(hour FROM created_at)
        ORDER BY hour
      ` as Array<{ hour: number; count: bigint }>,
      prisma.auditLog.groupBy({
        by: ['userId'],
        where: { 
          createdAt: { gte: startDate },
          userId: { not: 'anonymous' }
        },
        _count: { userId: true },
        _max: { createdAt: true },
        orderBy: { _count: { userId: 'desc' } }
      })
    ]);

    const userIds = userActivity.map(u => u.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    return {
      totalActions,
      uniqueUsers: uniqueUsersResult.length,
      topActions: actionCounts.map(a => ({
        action: a.action,
        count: a._count.action
      })),
      hourlyDistribution: hourlyData.map(h => ({
        hour: h.hour,
        count: Number(h.count)
      })),
      userActivity: userActivity.map(ua => {
        const user = userMap.get(ua.userId);
        return {
          userId: ua.userId,
          userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
          role: user?.role || 'UNKNOWN',
          actionCount: ua._count.userId,
          lastActivity: ua._max.createdAt!
        };
      }).slice(0, 20)
    };
  }

  async getSecurityEvents(hours: number = 24): Promise<SecurityEvent[]> {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);
    const events: SecurityEvent[] = [];

    // Failed login attempts
    const failedLogins = await prisma.auditLog.findMany({
      where: {
        createdAt: { gte: startDate },
        action: 'LOGIN',
        description: { contains: 'Failed' }
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    });

    // Group failed logins by IP
    const failedLoginsByIP = new Map<string, any[]>();
    for (const login of failedLogins) {
      const ip = login.ipAddress || 'unknown';
      if (!failedLoginsByIP.has(ip)) {
        failedLoginsByIP.set(ip, []);
      }
      failedLoginsByIP.get(ip)!.push(login);
    }

    // Multiple failed logins from same IP
    for (const [ip, logins] of failedLoginsByIP.entries()) {
      if (logins.length >= 5) {
        events.push({
          id: `failed-logins-${ip}`,
          type: 'MULTIPLE_FAILED_LOGINS',
          severity: logins.length >= 10 ? 'HIGH' : 'MEDIUM',
          description: `${logins.length} failed login attempts from IP ${ip}`,
          ipAddress: ip,
          timestamp: logins[0].createdAt,
          details: {
            attemptCount: logins.length,
            timeRange: `${logins[logins.length - 1].createdAt} - ${logins[0].createdAt}`,
            targetedEmails: [...new Set(logins.map(l => l.description?.split(' ')[4]).filter(Boolean))]
          }
        });
      }
    }

    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Get filter options from actual audit log data
  async getAuditLogFilterOptions() {
    try {
      const [actions, resources, users] = await Promise.all([
        // Get unique actions
        prisma.auditLog.findMany({
          select: { action: true },
          distinct: ['action'],
          orderBy: { action: 'asc' }
        }),
        // Get unique table names (resources)
        prisma.auditLog.findMany({
          select: { tableName: true },
          distinct: ['tableName'],
          where: {
            tableName: { not: 'unknown' }
          },
          orderBy: { tableName: 'asc' }
        }),
        // Get users who have audit log entries
        prisma.user.findMany({
          where: {
            auditLogs: {
              some: {}
            }
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          },
          orderBy: [
            { firstName: 'asc' },
            { lastName: 'asc' }
          ]
        })
      ]);

      // Filter out unwanted resources (query parameters, UUIDs, etc.)
      const filteredResources = resources.filter(r => {
        const tableName = r.tableName;
        // Exclude query parameters
        if (tableName.startsWith('?') || tableName.includes('=')) return false;
        // Exclude UUIDs
        if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(tableName)) return false;
        // Exclude entries that look like query strings or endpoints with parameters
        if (tableName.includes('?') || tableName.includes('&')) return false;
        // Only include meaningful table names
        return tableName.length > 0 && tableName !== 'unknown';
      });

      return {
        actions: actions.map(a => ({
          value: a.action,
          label: a.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
        })),
        resources: filteredResources.map(r => ({
          value: r.tableName,
          label: r.tableName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        })),
        users: users.map(u => ({
          value: u.id,
          label: `${u.firstName} ${u.lastName} (${u.email})`,
          role: u.role
        }))
      };
    } catch (error) {
      console.error('Error getting audit log filter options:', error);
      return {
        actions: [],
        resources: [],
        users: []
      };
    }
  }

  // Get filter options for GDPR audit logs
  async getGDPRLogFilterOptions() {
    try {
      const [actions, dataTypes, users] = await Promise.all([
        // Get unique GDPR actions
        prisma.gDPRAuditLog.findMany({
          select: { action: true },
          distinct: ['action'],
          orderBy: { action: 'asc' }
        }),
        // Get unique data types
        prisma.gDPRAuditLog.findMany({
          select: { dataType: true },
          distinct: ['dataType'],
          orderBy: { dataType: 'asc' }
        }),
        // Get users who have GDPR audit log entries
        prisma.user.findMany({
          where: {
            gdprAuditLogs: {
              some: {}
            }
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          },
          orderBy: [
            { firstName: 'asc' },
            { lastName: 'asc' }
          ]
        })
      ]);

      return {
        actions: actions.map(a => ({
          value: a.action,
          label: a.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
        })),
        dataTypes: dataTypes.map(d => ({
          value: d.dataType,
          label: d.dataType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        })),
        users: users.map(u => ({
          value: u.id,
          label: `${u.firstName} ${u.lastName} (${u.email})`,
          role: u.role
        }))
      };
    } catch (error) {
      console.error('Error getting GDPR log filter options:', error);
      return {
        actions: [],
        dataTypes: [],
        users: []
      };
    }
  }
}

// Export both the class and instance for backward compatibility
export const AuditService = EnhancedAuditService;
export default new EnhancedAuditService();