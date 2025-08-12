import { AuditService } from '../services/auditService';
/**
 * Middleware to add audit information to request context
 */
export const auditMiddleware = (req, res, next) => {
    try {
        // Add audit helper methods to request
        req.audit = {
            logCreate: async (tableName, recordId, newValues, description) => {
                await AuditService.logCreate(req, tableName, recordId, newValues, description);
            },
            logUpdate: async (tableName, recordId, oldValues, newValues, description) => {
                await AuditService.logUpdate(req, tableName, recordId, oldValues, newValues, description);
            },
            logDelete: async (tableName, recordId, oldValues, description) => {
                await AuditService.logDelete(req, tableName, recordId, oldValues, description);
            },
            getUserId: () => {
                const user = req.user;
                return user?.id || null;
            }
        };
        next();
    }
    catch (error) {
        console.error('Audit middleware error:', error);
        next(); // Continue even if audit setup fails
    }
};
/**
 * Helper function to get user ID from request
 */
export const getUserId = (req) => {
    const user = req.user;
    return user?.id || null;
};
//# sourceMappingURL=audit.js.map