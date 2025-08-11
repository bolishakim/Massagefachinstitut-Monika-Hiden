import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/auditService';

/**
 * Middleware to add audit information to request context
 */
export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Add audit helper methods to request
    (req as any).audit = {
      logCreate: async (tableName: string, recordId: string, newValues: any, description?: string) => {
        await AuditService.logCreate(req, tableName, recordId, newValues, description);
      },
      logUpdate: async (tableName: string, recordId: string, oldValues: any, newValues: any, description?: string) => {
        await AuditService.logUpdate(req, tableName, recordId, oldValues, newValues, description);
      },
      logDelete: async (tableName: string, recordId: string, oldValues: any, description?: string) => {
        await AuditService.logDelete(req, tableName, recordId, oldValues, description);
      },
      getUserId: () => {
        const user = (req as any).user;
        return user?.id || null;
      }
    };

    next();
  } catch (error) {
    console.error('Audit middleware error:', error);
    next(); // Continue even if audit setup fails
  }
};

/**
 * Helper function to get user ID from request
 */
export const getUserId = (req: Request): string | null => {
  const user = (req as any).user;
  return user?.id || null;
};

/**
 * Interface to extend Express Request with audit helpers
 */
declare global {
  namespace Express {
    interface Request {
      audit?: {
        logCreate: (tableName: string, recordId: string, newValues: any, description?: string) => Promise<void>;
        logUpdate: (tableName: string, recordId: string, oldValues: any, newValues: any, description?: string) => Promise<void>;
        logDelete: (tableName: string, recordId: string, oldValues: any, description?: string) => Promise<void>;
        getUserId: () => string | null;
      };
    }
  }
}