import { PrismaClient, AuditAction } from '@prisma/client';
const prisma = new PrismaClient();
export class AuditService {
    /**
     * Create an audit log entry
     */
    static async createAuditLog(data) {
        try {
            await prisma.auditLog.create({
                data: {
                    userId: data.userId,
                    action: data.action,
                    tableName: data.tableName,
                    recordId: data.recordId,
                    oldValues: data.oldValues,
                    newValues: data.newValues,
                    description: data.description,
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent,
                },
            });
        }
        catch (error) {
            console.error('Failed to create audit log:', error);
            // Don't throw error to avoid breaking the main operation
        }
    }
    /**
     * Extract user info from request (assuming user is attached via auth middleware)
     */
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
    /**
     * Log creation of a record
     */
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
    /**
     * Log update of a record
     */
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
    /**
     * Log deletion of a record
     */
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
    /**
     * Clean sensitive data from values before logging
     */
    static cleanSensitiveData(data) {
        if (!data || typeof data !== 'object')
            return data;
        const cleaned = { ...data };
        // Remove sensitive fields
        const sensitiveFields = ['password', 'resetPasswordToken', 'emailVerificationToken', 'refreshToken'];
        for (const field of sensitiveFields) {
            if (cleaned[field]) {
                cleaned[field] = '[REDACTED]';
            }
        }
        return cleaned;
    }
}
//# sourceMappingURL=auditService.js.map