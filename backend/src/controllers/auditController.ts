import { Request, Response } from 'express';
import auditService from '../services/auditService';
import { Role } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
  };
}

export const auditController = {
  // Get general audit logs
  async getAuditLogs(req: AuthenticatedRequest, res: Response) {
    try {
      // Only admins can view general audit logs
      if (req.user?.role !== Role.ADMIN) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions. Admin access required.'
        });
      }

      const {
        startDate,
        endDate,
        userId,
        action,
        resource,
        resourceId,
        ipAddress,
        page = '1',
        limit = '50'
      } = req.query;

      const query = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        userId: userId as string,
        action: action as string,
        resource: resource as string,
        resourceId: resourceId as string,
        ipAddress: ipAddress as string,
        page: parseInt(page as string, 10),
        limit: Math.min(parseInt(limit as string, 10), 100) // Max 100 items per page
      };

      const result = await auditService.getAuditLogs(query);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // Get GDPR audit logs
  async getGDPRAuditLogs(req: AuthenticatedRequest, res: Response) {
    try {
      // Admins and moderators can view GDPR audit logs
      if (!req.user || ![Role.ADMIN, Role.MODERATOR].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions. Admin or moderator access required.'
        });
      }

      const {
        startDate,
        endDate,
        userId,
        action,
        resourceId,
        page = '1',
        limit = '50'
      } = req.query;

      const query = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        userId: userId as string,
        action: action as string,
        resourceId: resourceId as string,
        page: parseInt(page as string, 10),
        limit: Math.min(parseInt(limit as string, 10), 100)
      };

      const result = await auditService.getGDPRAuditLogs(query);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error fetching GDPR audit logs:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // Get patient access report
  async getPatientAccessReport(req: AuthenticatedRequest, res: Response) {
    try {
      // Admins and moderators can view patient access reports
      if (!req.user || ![Role.ADMIN, Role.MODERATOR].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions. Admin or moderator access required.'
        });
      }

      const { patientId, days = '30' } = req.query;

      const result = await auditService.getPatientAccessReport(
        patientId as string,
        parseInt(days as string, 10)
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error generating patient access report:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // Get system activity summary
  async getSystemActivitySummary(req: AuthenticatedRequest, res: Response) {
    try {
      // Only admins can view system activity summaries
      if (req.user?.role !== Role.ADMIN) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions. Admin access required.'
        });
      }

      const { days = '7' } = req.query;

      const result = await auditService.getSystemActivitySummary(
        parseInt(days as string, 10)
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error generating system activity summary:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // Get security events
  async getSecurityEvents(req: AuthenticatedRequest, res: Response) {
    try {
      // Only admins can view security events
      if (req.user?.role !== Role.ADMIN) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions. Admin access required.'
        });
      }

      const { hours = '24' } = req.query;

      const result = await auditService.getSecurityEvents(
        parseInt(hours as string, 10)
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error fetching security events:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // Get my audit logs (user can see their own audit trail)
  async getMyAuditLogs(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const {
        startDate,
        endDate,
        action,
        resource,
        page = '1',
        limit = '50'
      } = req.query;

      const query = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        userId: req.user.id, // Force to user's own ID
        action: action as string,
        resource: resource as string,
        page: parseInt(page as string, 10),
        limit: Math.min(parseInt(limit as string, 10), 100)
      };

      const result = await auditService.getAuditLogs(query);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error fetching user audit logs:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // Get compliance report
  async getComplianceReport(req: AuthenticatedRequest, res: Response) {
    try {
      // Only admins can generate compliance reports
      if (req.user?.role !== Role.ADMIN) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions. Admin access required.'
        });
      }

      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'Start date and end date are required'
        });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (start >= end) {
        return res.status(400).json({
          success: false,
          error: 'Start date must be before end date'
        });
      }

      const report = await auditService.getComplianceReport(start, end);

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('Error generating compliance report:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // Get audit dashboard data (summary for admin dashboard)
  async getAuditDashboard(req: AuthenticatedRequest, res: Response) {
    try {
      // Only admins can view audit dashboard
      if (req.user?.role !== Role.ADMIN) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions. Admin access required.'
        });
      }

      const { days = '7' } = req.query;
      const daysNum = parseInt(days as string, 10);

      // Get multiple summary reports in parallel
      const [activitySummary, securityEvents, patientAccessReport] = await Promise.all([
        auditService.getSystemActivitySummary(daysNum),
        auditService.getSecurityEvents(24), // Last 24 hours for security events
        auditService.getPatientAccessReport(undefined, daysNum)
      ]);

      const dashboard = {
        period: {
          days: daysNum,
          startDate: new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000),
          endDate: new Date()
        },
        activity: activitySummary,
        security: {
          events: securityEvents,
          criticalEvents: securityEvents.filter(e => e.severity === 'CRITICAL').length,
          highSeverityEvents: securityEvents.filter(e => e.severity === 'HIGH').length,
        },
        patientAccess: {
          totalPatients: patientAccessReport.length,
          mostAccessedPatients: patientAccessReport
            .sort((a, b) => b.accessCount - a.accessCount)
            .slice(0, 10),
          totalAccesses: patientAccessReport.reduce((sum, p) => sum + p.accessCount, 0)
        },
        compliance: {
          status: 'COMPLIANT', // Could be enhanced with actual compliance checks
          lastReportGenerated: new Date(),
          totalAuditEntries: activitySummary.totalActions
        }
      };

      res.json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      console.error('Error generating audit dashboard:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // Get filter options for audit logs
  async getAuditLogFilterOptions(req: AuthenticatedRequest, res: Response) {
    try {
      // Only admins can view audit log filter options
      if (req.user?.role !== Role.ADMIN) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions. Admin access required.'
        });
      }

      const options = await auditService.getAuditLogFilterOptions();

      res.json({
        success: true,
        data: options
      });
    } catch (error) {
      console.error('Error fetching audit log filter options:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // Get filter options for GDPR logs
  async getGDPRLogFilterOptions(req: AuthenticatedRequest, res: Response) {
    try {
      // Only admins can view GDPR log filter options
      if (req.user?.role !== Role.ADMIN) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions. Admin access required.'
        });
      }

      const options = await auditService.getGDPRLogFilterOptions();

      res.json({
        success: true,
        data: options
      });
    } catch (error) {
      console.error('Error fetching GDPR log filter options:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
};