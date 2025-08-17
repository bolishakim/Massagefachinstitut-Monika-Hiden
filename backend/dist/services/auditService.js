import prisma from '../utils/db';
import { AuditAction } from '@prisma/client';
class EnhancedAuditService {
    // Legacy methods for backward compatibility
    static async createAuditLog(data) {
        try {
            await prisma.auditLog.create({ data });
        }
        catch (error) {
            console.error('Failed to create audit log:', error);
        }
    }
    static getUserFromRequest(req) {
        const user = req.user;
        if (!user?.id) {
            throw new Error('User not found in request. Make sure authentication middleware is applied.');
        }
        return {
            userId: user.id,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
        };
    }
    static async logCreate(req, tableName, recordId, newValues, description) {
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
        }
        catch (error) {
            console.error('Audit logging failed for CREATE:', error);
        }
    }
    static async logUpdate(req, tableName, recordId, oldValues, newValues, description) {
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
        }
        catch (error) {
            console.error('Audit logging failed for UPDATE:', error);
        }
    }
    static async logDelete(req, tableName, recordId, oldValues, description) {
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
        }
        catch (error) {
            console.error('Audit logging failed for DELETE:', error);
        }
    }
    static cleanSensitiveData(data) {
        if (!data || typeof data !== 'object')
            return data;
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
    async getAuditLogs(query) {
        const { startDate, endDate, userId, action, resource, resourceId, ipAddress, page = 1, limit = 50 } = query;
        const where = {};
        if (startDate && endDate) {
            where.createdAt = {
                gte: startDate,
                lte: endDate
            };
        }
        if (userId)
            where.userId = userId;
        if (action)
            where.action = action;
        if (resource)
            where.tableName = { contains: resource, mode: 'insensitive' };
        if (resourceId)
            where.recordId = resourceId;
        if (ipAddress)
            where.ipAddress = { contains: ipAddress };
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
    async getGDPRAuditLogs(query) {
        const { startDate, endDate, userId, action, resourceId, page = 1, limit = 50 } = query;
        const where = {};
        if (startDate && endDate) {
            where.createdAt = {
                gte: startDate,
                lte: endDate
            };
        }
        if (userId)
            where.userId = userId;
        if (action)
            where.action = action;
        if (resourceId)
            where.recordId = resourceId;
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
    async getPatientAccessReport(patientId, days = 30) {
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
                orderBy: { createdAt: 'desc' }
            }),
            prisma.auditLog.findMany({
                where: {
                    createdAt: { gte: startDate },
                    action: { in: ['VIEW_DETAILED', 'VIEW_LIST'] },
                    tableName: { in: ['Patient', 'PatientHistory'] },
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
                orderBy: { createdAt: 'desc' }
            })
        ]);
        // Combine all logs and create individual access entries for each API call
        const allLogs = [
            ...gdprLogs.map(log => ({ ...log, source: 'gdpr' })),
            ...detailedAuditLogs.map(log => {
                const extractedPatientId = this.extractPatientIdFromAuditLog(log);
                return { ...log, recordId: extractedPatientId || log.recordId, source: 'audit' };
            }).filter(log => log.recordId && log.recordId !== 'list_view')
        ];
        // Group by patient to create individual access reports
        const patientAccessMap = new Map();
        // Process each individual log as a separate access entry
        for (const log of allLogs) {
            if (!log.user || !log.recordId || log.recordId === 'list_view')
                continue;
            const patientKey = log.recordId;
            if (!patientAccessMap.has(patientKey)) {
                // Get patient information
                const patient = await prisma.patient.findUnique({
                    where: { id: patientKey },
                    select: {
                        firstName: true,
                        lastName: true,
                        id: true,
                        email: true,
                        phone: true,
                        dateOfBirth: true
                    }
                });
                if (!patient)
                    continue;
                patientAccessMap.set(patientKey, {
                    patientId: patient.id,
                    patientName: `${patient.firstName} ${patient.lastName}`,
                    patientEmail: patient.email,
                    patientPhone: patient.phone,
                    patientDOB: patient.dateOfBirth,
                    accessCount: 0,
                    lastAccessed: log.createdAt,
                    firstAccessed: log.createdAt,
                    accessedBy: new Map(),
                    individualAccesses: [] // Store individual access entries
                });
            }
            const patientData = patientAccessMap.get(patientKey);
            // Add this individual access entry
            const accessEntry = {
                id: log.id,
                timestamp: log.createdAt,
                userId: log.user.id,
                userName: `${log.user.firstName} ${log.user.lastName}`,
                userEmail: log.user.email,
                userRole: log.user.role,
                action: log.action,
                source: log.source,
                ipAddress: log.ipAddress,
                userAgent: log.userAgent,
                dataType: log.source === 'gdpr' ? log.dataType : (log.tableName === 'Patient' ? 'patient_data' : 'patient_history'),
                accessType: log.source === 'gdpr' ? 'GDPR_DATA_ACCESS' : (log.action === 'VIEW_DETAILED' ? 'DETAIL_VIEW' : 'LIST_VIEW'),
                purpose: log.source === 'gdpr' ? log.purpose : 'Medical center operations',
                legalBasis: log.source === 'gdpr' ? log.legalBasis : 'Legitimate interest - Healthcare service provision'
            };
            patientData.individualAccesses.push(accessEntry);
            patientData.accessCount++;
            // Update timing
            if (log.createdAt > patientData.lastAccessed) {
                patientData.lastAccessed = log.createdAt;
            }
            if (log.createdAt < patientData.firstAccessed) {
                patientData.firstAccessed = log.createdAt;
            }
            // Track user-level summary
            const userKey = log.user.id;
            if (!patientData.accessedBy.has(userKey)) {
                patientData.accessedBy.set(userKey, {
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
            const userAccess = patientData.accessedBy.get(userKey);
            userAccess.accessCount++;
            if (log.createdAt > userAccess.lastAccessed) {
                userAccess.lastAccessed = log.createdAt;
            }
            if (log.createdAt < userAccess.firstAccessed) {
                userAccess.firstAccessed = log.createdAt;
            }
            // Add access details
            if (log.ipAddress)
                userAccess.ipAddresses.add(log.ipAddress);
            if (log.userAgent)
                userAccess.userAgents.add(log.userAgent);
            userAccess.accessTypes.add(accessEntry.accessType);
        }
        // Convert to final format with individual access details
        const result = Array.from(patientAccessMap.values()).map((patient) => {
            const accessedByArray = Array.from(patient.accessedBy.values()).map((accessor) => ({
                ...accessor,
                ipAddresses: Array.from(accessor.ipAddresses),
                userAgents: Array.from(accessor.userAgents),
                accessTypes: Array.from(accessor.accessTypes)
            }));
            return {
                patientId: patient.patientId,
                patientName: patient.patientName,
                patientEmail: patient.patientEmail,
                patientPhone: patient.patientPhone,
                patientDOB: patient.patientDOB,
                accessCount: Math.ceil(patient.accessCount / 4), // Divide by 4 to get logical access count
                lastAccessed: patient.lastAccessed,
                firstAccessed: patient.firstAccessed,
                accessedBy: accessedByArray.map(accessor => ({
                    ...accessor,
                    accessCount: Math.ceil(accessor.accessCount / 4) // Divide user access count by 4
                })),
                individualAccesses: patient.individualAccesses, // Include all individual access entries
                accessSummary: {
                    totalAccess: Math.ceil(patient.accessCount / 4), // Divide by 4 to get logical access count
                    uniqueUsers: accessedByArray.length,
                    uniqueIPs: new Set(accessedByArray.flatMap(a => a.ipAddresses)).size,
                    accessTypeDistribution: patient.individualAccesses.reduce((acc, access) => {
                        acc[access.accessType] = (acc[access.accessType] || 0) + 1;
                        return acc;
                    }, {}),
                    timeSpan: {
                        from: patient.firstAccessed,
                        to: patient.lastAccessed
                    }
                }
            };
        });
        return result.sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime());
    }
    groupIntoAccessSessions(logs) {
        const SESSION_WINDOW_MS = 30 * 1000; // 30 seconds to group related API calls within same session
        const sessions = [];
        // Group logs by user + patient combination first
        const userPatientLogs = new Map();
        for (const log of logs) {
            if (!log.user || !log.recordId)
                continue;
            const key = `${log.user.id}-${log.recordId}`;
            if (!userPatientLogs.has(key)) {
                userPatientLogs.set(key, []);
            }
            userPatientLogs.get(key).push(log);
        }
        // Process each user+patient combination separately
        for (const [userPatientKey, userLogs] of userPatientLogs) {
            // Sort logs by timestamp
            const sortedLogs = userLogs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            let currentSession = [];
            let lastLogTime = 0;
            for (const log of sortedLogs) {
                const logTime = new Date(log.createdAt).getTime();
                // If this is the first log or there's a gap > 30 seconds from the last log in current session
                if (currentSession.length === 0 || (logTime - lastLogTime > SESSION_WINDOW_MS)) {
                    // Start a new session
                    if (currentSession.length > 0) {
                        sessions.push([...currentSession]);
                    }
                    currentSession = [log];
                }
                else {
                    // Add to current session
                    currentSession.push(log);
                }
                lastLogTime = logTime;
            }
            // Don't forget the last session
            if (currentSession.length > 0) {
                sessions.push([...currentSession]);
            }
        }
        return sessions;
    }
    groupLogsIntoSessions(logs) {
        const SESSION_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
        const sessionGroups = [];
        const userPatientSessions = new Map();
        // Sort logs by timestamp to process chronologically
        const sortedLogs = logs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        for (const log of sortedLogs) {
            if (!log.user || !log.recordId)
                continue;
            // Create unique key for user + patient combination
            const sessionKey = `${log.user.id}-${log.recordId}`;
            const logTime = new Date(log.createdAt).getTime();
            if (!userPatientSessions.has(sessionKey)) {
                userPatientSessions.set(sessionKey, []);
            }
            const userSessions = userPatientSessions.get(sessionKey);
            // Find if this log belongs to an existing session (within time window)
            let addedToSession = false;
            for (const session of userSessions) {
                const sessionStart = Math.min(...session.map((l) => new Date(l.createdAt).getTime()));
                const sessionEnd = Math.max(...session.map((l) => new Date(l.createdAt).getTime()));
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
    async processPatientAccessSession(sessionLogs, patientAccess) {
        if (sessionLogs.length === 0)
            return;
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
            if (!patient)
                return;
            patientAccess.set(patientKey, {
                patientId: patient.id,
                patientName: `${patient.firstName} ${patient.lastName}`,
                patientEmail: patient.email,
                patientPhone: patient.phone,
                patientDOB: patient.dateOfBirth,
                accessCount: 0,
                lastAccessed: representativeLog.createdAt,
                accessors: new Map(),
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
                if (log.ipAddress)
                    userAccess.ipAddresses.add(log.ipAddress);
                if (log.userAgent)
                    userAccess.userAgents.add(log.userAgent);
                if (log.newValues?.accessType) {
                    userAccess.accessTypes.add(log.newValues.accessType);
                }
            }
        }
    }
    async processPatientAccessLog(log, patientAccess, source) {
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
            if (!patient)
                return;
            patientAccess.set(patientKey, {
                patientId: patient.id,
                patientName: `${patient.firstName} ${patient.lastName}`,
                patientEmail: patient.email,
                patientPhone: patient.phone,
                patientDOB: patient.dateOfBirth,
                accessCount: 0,
                lastAccessed: log.createdAt,
                accessors: new Map(),
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
            if (log.ipAddress)
                userAccess.ipAddresses.add(log.ipAddress);
            if (log.userAgent)
                userAccess.userAgents.add(log.userAgent);
            if (source === 'audit' && log.newValues?.accessType) {
                userAccess.accessTypes.add(log.newValues.accessType);
            }
        }
    }
    extractPatientIdFromAuditLog(log) {
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
    async getDetailedAccessSessions(patientId, userId, startDate) {
        const sessions = await prisma.auditLog.findMany({
            where: {
                userId,
                createdAt: { gte: startDate },
                recordId: patientId,
                tableName: { in: ['Patient', 'PatientHistory'] }
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
    generateAccessSummary(accessors) {
        const totalAccess = accessors.reduce((sum, a) => sum + a.accessCount, 0);
        const uniqueIPs = new Set(accessors.flatMap(a => Array.from(a.ipAddresses || []))).size;
        const roleDistribution = accessors.reduce((roles, a) => {
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
    async getSystemActivitySummary(days = 7) {
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
            prisma.$queryRaw `
        SELECT 
          EXTRACT(hour FROM created_at) as hour,
          COUNT(*) as count
        FROM audit_logs 
        WHERE created_at >= ${startDate}
        GROUP BY EXTRACT(hour FROM created_at)
        ORDER BY hour
      `,
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
                    lastActivity: ua._max.createdAt
                };
            }).slice(0, 20)
        };
    }
    async getSecurityEvents(hours = 24) {
        const startDate = new Date();
        startDate.setHours(startDate.getHours() - hours);
        const events = [];
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
        const failedLoginsByIP = new Map();
        for (const login of failedLogins) {
            const ip = login.ipAddress || 'unknown';
            if (!failedLoginsByIP.has(ip)) {
                failedLoginsByIP.set(ip, []);
            }
            failedLoginsByIP.get(ip).push(login);
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
                if (tableName.startsWith('?') || tableName.includes('='))
                    return false;
                // Exclude UUIDs
                if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(tableName))
                    return false;
                // Exclude entries that look like query strings or endpoints with parameters
                if (tableName.includes('?') || tableName.includes('&'))
                    return false;
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
        }
        catch (error) {
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
        }
        catch (error) {
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
//# sourceMappingURL=auditService.js.map