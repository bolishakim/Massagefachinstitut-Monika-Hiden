import { PrismaClient, DataRequestType, GDPRAction } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { AuditService } from './auditService.js';
const prisma = new PrismaClient();
export class GDPRService {
    /**
     * Record user consent for data processing
     */
    static async recordConsent(req, userId, consentData) {
        try {
            const ipAddress = req.ip || req.connection.remoteAddress ||
                req.socket?.remoteAddress ||
                req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                'unknown';
            const userAgent = req.get('User-Agent');
            console.log('Recording consent - IP:', ipAddress, 'UserAgent:', userAgent ? 'present' : 'missing');
            const consentRecord = await prisma.consentRecord.create({
                data: {
                    userId,
                    consentType: consentData.consentType,
                    granted: consentData.granted,
                    ipAddress,
                    userAgent,
                    consentString: consentData.consentString,
                    expiresAt: consentData.expiresAt,
                },
            });
            // Log GDPR action
            await this.logGDPRAction(req, userId, consentData.granted ? GDPRAction.CONSENT_GIVEN : GDPRAction.CONSENT_WITHDRAWN, 'ConsentRecord', consentRecord.id, 'legitimate_interest', `Consent ${consentData.granted ? 'granted' : 'withdrawn'} for ${consentData.consentType}`, false, consentRecord.id);
            return { success: true };
        }
        catch (error) {
            console.error('Error recording consent:', error);
            return { success: false, error: 'Failed to record consent' };
        }
    }
    /**
     * Get user's current consent status
     */
    static async getUserConsent(userId) {
        try {
            const consents = await prisma.consentRecord.findMany({
                where: {
                    userId,
                    withdrawnAt: null, // Not withdrawn
                    OR: [
                        { expiresAt: null }, // No expiration
                        { expiresAt: { gt: new Date() } }, // Not expired
                    ],
                },
                orderBy: { createdAt: 'desc' },
            });
            const consentStatus = {
                NECESSARY: true, // Always required for system function
                SYSTEM_OPTIMIZATION: false,
                NOTIFICATIONS: false,
                AUDIT_MONITORING: false,
            };
            // Get the latest consent for each type
            consents.forEach((consent) => {
                if (!consentStatus.hasOwnProperty(consent.consentType)) {
                    consentStatus[consent.consentType] = consent.granted;
                }
            });
            return consentStatus;
        }
        catch (error) {
            console.error('Error getting user consent:', error);
            return {
                NECESSARY: true,
                SYSTEM_OPTIMIZATION: false,
                NOTIFICATIONS: false,
                AUDIT_MONITORING: false,
            };
        }
    }
    /**
     * Export all user data for GDPR compliance
     */
    static async exportUserData(req, userId) {
        try {
            // Create export request record
            const exportRequest = await prisma.dataExportRequest.create({
                data: {
                    userId,
                    requestType: DataRequestType.EXPORT,
                    requestedData: ['all'],
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                },
            });
            // Collect all user data
            const userData = await this.collectAllUserData(userId);
            // Generate export file
            const exportDir = path.join(process.cwd(), 'exports');
            await fs.mkdir(exportDir, { recursive: true });
            const fileName = `user-data-export-${userId}-${Date.now()}.json`;
            const filePath = path.join(exportDir, fileName);
            await fs.writeFile(filePath, JSON.stringify(userData, null, 2), 'utf8');
            // Update export request
            await prisma.dataExportRequest.update({
                where: { id: exportRequest.id },
                data: {
                    status: 'COMPLETED',
                    filePath: fileName,
                },
            });
            // Log GDPR action
            await this.logGDPRAction(req, userId, GDPRAction.DATA_EXPORT, 'User', userId, 'data_portability', 'User data exported for GDPR compliance', false);
            return {
                success: true,
                filePath: fileName,
                requestId: exportRequest.id,
            };
        }
        catch (error) {
            console.error('Error exporting user data:', error);
            return { success: false, error: 'Failed to export user data' };
        }
    }
    /**
     * Collect all user data for export
     */
    static async collectAllUserData(userId) {
        try {
            // Get user profile data
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    consentRecords: true,
                    dataExportRequests: true,
                    notifications: true,
                },
            });
            if (!user) {
                throw new Error('User not found');
            }
            // Get medical-related data if user created patients/appointments
            const medicalData = {
                patientsCreated: await prisma.patient.findMany({
                    where: { createdById: userId },
                    include: {
                        appointments: true,
                        patientHistory: true,
                        packages: true,
                        payments: true,
                    },
                }),
                appointments: await prisma.appointment.findMany({
                    where: {
                        OR: [
                            { createdById: userId },
                            { staffId: userId },
                        ],
                    },
                    include: {
                        patient: true,
                        service: true,
                        room: true,
                    },
                }),
                patientHistory: await prisma.patientHistory.findMany({
                    where: { createdById: userId },
                    include: {
                        patient: true,
                    },
                }),
            };
            // Get system/audit data
            const systemData = {
                auditLogs: await prisma.auditLog.findMany({
                    where: { userId },
                    orderBy: { createdAt: 'desc' },
                }),
                sessions: await prisma.userSession.findMany({
                    where: { userId },
                    orderBy: { createdAt: 'desc' },
                }),
                consents: user.consentRecords,
            };
            // Clean sensitive data
            const cleanUser = AuditService.cleanSensitiveData(user);
            return {
                user: cleanUser,
                medicalData,
                systemData,
                exportMetadata: {
                    exportedAt: new Date().toISOString(),
                    requestedBy: userId,
                    dataTypes: ['profile', 'medical', 'audit', 'consent'],
                },
            };
        }
        catch (error) {
            console.error('Error collecting user data:', error);
            throw error;
        }
    }
    /**
     * Hard delete user and all related data (Right to Erasure)
     */
    static async hardDeleteUser(req, userId) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                return { success: false, error: 'User not found' };
            }
            // Log deletion before removing data
            await this.logGDPRAction(req, userId, GDPRAction.DATA_DELETION, 'User', userId, 'erasure_request', 'User account and all data permanently deleted per GDPR Article 17', false);
            // Delete in correct order to handle foreign key constraints
            await prisma.$transaction(async (tx) => {
                // Delete GDPR-related records
                await tx.consentRecord.deleteMany({ where: { userId } });
                await tx.dataExportRequest.deleteMany({ where: { userId } });
                await tx.gDPRAuditLog.deleteMany({ where: { userId } });
                // Delete user sessions and notifications
                await tx.userSession.deleteMany({ where: { userId } });
                await tx.notification.deleteMany({ where: { userId } });
                // Delete audit logs
                await tx.auditLog.deleteMany({ where: { userId } });
                // Update created records to remove user reference (anonymize rather than delete)
                await tx.patient.updateMany({
                    where: { createdById: userId },
                    data: { createdById: 'deleted-user-' + Date.now() },
                });
                await tx.appointment.updateMany({
                    where: { createdById: userId },
                    data: { createdById: 'deleted-user-' + Date.now() },
                });
                await tx.service.updateMany({
                    where: { createdById: userId },
                    data: { createdById: 'deleted-user-' + Date.now() },
                });
                await tx.room.updateMany({
                    where: { createdById: userId },
                    data: { createdById: 'deleted-user-' + Date.now() },
                });
                await tx.patientHistory.updateMany({
                    where: { createdById: userId },
                    data: { createdById: 'deleted-user-' + Date.now() },
                });
                await tx.package.updateMany({
                    where: { createdById: userId },
                    data: { createdById: 'deleted-user-' + Date.now() },
                });
                await tx.payment.updateMany({
                    where: { createdById: userId },
                    data: { createdById: 'deleted-user-' + Date.now() },
                });
                // Finally delete the user
                await tx.user.delete({ where: { id: userId } });
            });
            return { success: true };
        }
        catch (error) {
            console.error('Error hard deleting user:', error);
            return { success: false, error: 'Failed to delete user data' };
        }
    }
    /**
     * Log GDPR-specific actions for compliance audit trail
     */
    static async logGDPRAction(req, userId, action, dataType, recordId, legalBasis, purpose, automated = false, consentId) {
        try {
            const ipAddress = req.ip || req.connection.remoteAddress ||
                req.socket?.remoteAddress ||
                req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                'unknown';
            const userAgent = req.get('User-Agent');
            console.log('Logging GDPR action - IP:', ipAddress, 'Action:', action);
            await prisma.gDPRAuditLog.create({
                data: {
                    userId,
                    action,
                    dataType,
                    recordId,
                    legalBasis,
                    purpose,
                    ipAddress,
                    userAgent,
                    consentId,
                    automated,
                },
            });
        }
        catch (error) {
            console.error('Error logging GDPR action:', error);
        }
    }
    /**
     * Clean up expired data per retention policies
     */
    static async cleanupExpiredData() {
        let cleaned = 0;
        const errors = [];
        try {
            // Create a mock request object for automated cleanup logging
            const systemReq = {
                ip: 'system',
                connection: { remoteAddress: 'system' },
                socket: { remoteAddress: 'system' },
                headers: { 'x-forwarded-for': 'system' },
                get: () => 'GDPR-Cleanup-Job/1.0',
            };
            // Get all retention policies
            const policies = await prisma.dataRetentionPolicy.findMany({
                where: { autoDelete: true },
            });
            for (const policy of policies) {
                try {
                    const cutoffDate = new Date();
                    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriod);
                    let deletedCount = 0;
                    switch (policy.dataType) {
                        case 'AuditLog':
                            deletedCount = (await prisma.auditLog.deleteMany({
                                where: { createdAt: { lt: cutoffDate } },
                            })).count;
                            break;
                        case 'GDPRAuditLog':
                            deletedCount = (await prisma.gDPRAuditLog.deleteMany({
                                where: { createdAt: { lt: cutoffDate } },
                            })).count;
                            break;
                        case 'UserSession':
                            deletedCount = (await prisma.userSession.deleteMany({
                                where: {
                                    OR: [
                                        { expiresAt: { lt: new Date() } },
                                        { createdAt: { lt: cutoffDate } },
                                    ],
                                },
                            })).count;
                            break;
                        case 'ConsentRecord':
                            deletedCount = (await prisma.consentRecord.deleteMany({
                                where: {
                                    AND: [
                                        { expiresAt: { not: null } },
                                        { expiresAt: { lt: new Date() } },
                                    ],
                                },
                            })).count;
                            break;
                        case 'DataExportRequest':
                            deletedCount = (await prisma.dataExportRequest.deleteMany({
                                where: {
                                    AND: [
                                        { expiresAt: { lt: new Date() } },
                                        { status: 'COMPLETED' },
                                    ],
                                },
                            })).count;
                            // Also clean up actual export files
                            if (deletedCount > 0) {
                                await this.cleanupExportFiles();
                            }
                            break;
                        default:
                            console.log(`No cleanup handler for data type: ${policy.dataType}`);
                    }
                    cleaned += deletedCount;
                    console.log(`Cleaned up ${deletedCount} records of type ${policy.dataType}`);
                    // Log automated cleanup action
                    if (deletedCount > 0) {
                        await this.logGDPRAction(systemReq, null, // System action, not user-specific
                        GDPRAction.DATA_DELETION, policy.dataType, null, policy.legalBasis, `Automated cleanup: deleted ${deletedCount} expired ${policy.dataType} records per retention policy`, true // This is an automated action
                        );
                    }
                }
                catch (error) {
                    const errorMsg = `Error cleaning up ${policy.dataType}: ${error}`;
                    console.error(errorMsg);
                    errors.push(errorMsg);
                }
            }
            return { cleaned, errors };
        }
        catch (error) {
            console.error('Error in data cleanup:', error);
            return { cleaned, errors: [error instanceof Error ? error.message : 'Unknown error'] };
        }
    }
    /**
     * Clean up expired export files from disk
     */
    static async cleanupExportFiles() {
        try {
            const exportDir = path.join(process.cwd(), 'exports');
            const files = await fs.readdir(exportDir).catch(() => []);
            for (const file of files) {
                if (file.startsWith('user-data-export-')) {
                    const filePath = path.join(exportDir, file);
                    const stats = await fs.stat(filePath);
                    // Delete files older than 30 days
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    if (stats.mtime < thirtyDaysAgo) {
                        await fs.unlink(filePath);
                        console.log(`Deleted expired export file: ${file}`);
                    }
                }
            }
        }
        catch (error) {
            console.error('Error cleaning up export files:', error);
        }
    }
    /**
     * Initialize default retention policies
     */
    static async initializeRetentionPolicies() {
        const defaultPolicies = [
            {
                dataType: 'AuditLog',
                retentionPeriod: 2555, // 7 years for administrative data
                description: 'Administrative audit logs',
                legalBasis: 'Legal obligation - Austrian data protection requirements',
                autoDelete: true,
            },
            {
                dataType: 'GDPRAuditLog',
                retentionPeriod: 2555, // 7 years
                description: 'GDPR compliance audit logs',
                legalBasis: 'Legal obligation - GDPR compliance demonstration',
                autoDelete: true,
            },
            {
                dataType: 'UserSession',
                retentionPeriod: 90, // 3 months
                description: 'User session data',
                legalBasis: 'Legitimate interest - Security monitoring',
                autoDelete: true,
            },
            {
                dataType: 'ConsentRecord',
                retentionPeriod: 2555, // 7 years - need to prove consent was given
                description: 'User consent records',
                legalBasis: 'Legal obligation - GDPR consent proof',
                autoDelete: false, // Keep consent records as proof
            },
            {
                dataType: 'Patient',
                retentionPeriod: 10950, // 30 years for medical records (Austrian healthcare law)
                description: 'Patient medical records',
                legalBasis: 'Legal obligation - Austrian healthcare data retention',
                autoDelete: false, // Manual review required for medical data
            },
        ];
        for (const policy of defaultPolicies) {
            await prisma.dataRetentionPolicy.upsert({
                where: { dataType: policy.dataType },
                update: policy,
                create: policy,
            });
        }
    }
}
//# sourceMappingURL=gdprService.js.map