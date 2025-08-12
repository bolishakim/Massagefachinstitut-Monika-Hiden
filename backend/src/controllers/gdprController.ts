import { Request, Response } from 'express';
import { z } from 'zod';
import { GDPRService } from '../services/gdprService.js';
import { ConsentType } from '@prisma/client';
import path from 'path';

// Validation schemas
const consentSchema = z.object({
  consentType: z.enum(['NECESSARY', 'SYSTEM_OPTIMIZATION', 'NOTIFICATIONS', 'AUDIT_MONITORING']),
  granted: z.boolean(),
  consentString: z.string().optional(),
  expiresAt: z.string().optional().transform((val) => val ? new Date(val) : undefined),
});

const bulkConsentSchema = z.object({
  consents: z.array(consentSchema),
});

/**
 * Record user consent for data processing
 */
export const recordConsent = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const data = consentSchema.parse(req.body);

    const result = await GDPRService.recordConsent(req, userId, {
      consentType: data.consentType as ConsentType,
      granted: data.granted,
      consentString: data.consentString,
      expiresAt: data.expiresAt,
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Consent recorded successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error recording consent:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid consent data',
        details: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to record consent',
    });
  }
};

/**
 * Record multiple consents at once (for consent banner)
 */
export const recordBulkConsent = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const data = bulkConsentSchema.parse(req.body);

    const results = await Promise.all(
      data.consents.map(consent =>
        GDPRService.recordConsent(req, userId, {
          consentType: consent.consentType as ConsentType,
          granted: consent.granted,
          consentString: consent.consentString,
          expiresAt: consent.expiresAt,
        })
      )
    );

    const failedConsents = results.filter(r => !r.success);
    
    if (failedConsents.length > 0) {
      res.status(500).json({
        success: false,
        error: 'Some consents failed to record',
        details: failedConsents,
      });
    } else {
      res.json({
        success: true,
        message: 'All consents recorded successfully',
      });
    }
  } catch (error) {
    console.error('Error recording bulk consent:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid consent data',
        details: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to record consents',
    });
  }
};

/**
 * Get user's current consent status
 */
export const getUserConsent = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const consents = await GDPRService.getUserConsent(userId);

    res.json({
      success: true,
      data: consents,
    });
  } catch (error) {
    console.error('Error getting user consent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve consent status',
    });
  }
};

/**
 * Export user data (GDPR Article 20 - Data Portability)
 */
export const exportUserData = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const result = await GDPRService.exportUserData(req, userId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Data export completed',
        data: {
          requestId: result.requestId,
          downloadUrl: `/api/gdpr/download-export/${result.filePath}`,
          expiresIn: '30 days',
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error exporting user data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export user data',
    });
  }
};

/**
 * Download exported data file
 */
export const downloadExport = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Verify the file belongs to the requesting user
    if (!filename.includes(userId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const filePath = path.join(process.cwd(), 'exports', filename);
    
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        if (!res.headersSent) {
          res.status(404).json({
            success: false,
            error: 'Export file not found or expired',
          });
        }
      }
    });
  } catch (error) {
    console.error('Error downloading export:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download export file',
    });
  }
};

/**
 * Request account deletion (GDPR Article 17 - Right to Erasure)
 */
export const requestAccountDeletion = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { confirmDeletion } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (!confirmDeletion) {
      return res.status(400).json({
        success: false,
        error: 'Deletion confirmation required',
      });
    }

    const result = await GDPRService.hardDeleteUser(req, userId);

    if (result.success) {
      // Clear authentication cookie since user is deleted
      res.clearCookie('refreshToken');
      
      res.json({
        success: true,
        message: 'Your account and all associated data have been permanently deleted',
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account',
    });
  }
};

/**
 * Get GDPR compliance information (for privacy page)
 */
export const getComplianceInfo = async (req: Request, res: Response) => {
  try {
    const complianceInfo = {
      dataController: {
        name: 'Medical Center',
        address: 'Your Address Here',
        email: 'privacy@medicalcenter.com',
        phone: '+43 1 234 5678',
      },
      dataProtectionOfficer: {
        name: 'Data Protection Officer',
        email: 'dpo@medicalcenter.com',
      },
      legalBases: [
        {
          type: 'consent',
          description: 'Marketing communications and analytics',
          withdrawable: true,
        },
        {
          type: 'contract',
          description: 'User account management and service provision',
          withdrawable: false,
        },
        {
          type: 'legal_obligation',
          description: 'Medical record retention as per Austrian healthcare law',
          withdrawable: false,
        },
        {
          type: 'legitimate_interest',
          description: 'Security monitoring and fraud prevention',
          withdrawable: false,
        },
      ],
      dataTypes: [
        'Personal identification data (name, email, phone)',
        'Medical information (as provided by healthcare professionals)',
        'Usage data (login times, accessed features)',
        'Technical data (IP address, browser information)',
        'Communication data (support messages, consent records)',
      ],
      retentionPeriods: {
        personalData: '7 years after account deletion',
        medicalData: '30 years as per Austrian healthcare law',
        auditLogs: '7 years for compliance demonstration',
        consentRecords: '7 years as proof of valid consent',
      },
      rights: [
        'Right to access your personal data',
        'Right to rectify inaccurate data',
        'Right to erase your data',
        'Right to restrict processing',
        'Right to data portability',
        'Right to object to processing',
        'Right to withdraw consent',
        'Right to lodge a complaint with supervisory authority',
      ],
    };

    res.json({
      success: true,
      data: complianceInfo,
    });
  } catch (error) {
    console.error('Error getting compliance info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve compliance information',
    });
  }
};

/**
 * Anonymous consent recording (for non-authenticated users)
 */
export const recordAnonymousConsent = async (req: Request, res: Response) => {
  try {
    const data = consentSchema.parse(req.body);

    const result = await GDPRService.recordConsent(req, null, {
      consentType: data.consentType as ConsentType,
      granted: data.granted,
      consentString: data.consentString,
      expiresAt: data.expiresAt,
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Anonymous consent recorded successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error recording anonymous consent:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid consent data',
        details: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to record anonymous consent',
    });
  }
};