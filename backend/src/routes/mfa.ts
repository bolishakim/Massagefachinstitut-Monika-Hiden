import express from 'express';
import { body, validationResult } from 'express-validator';
import { MFAService } from '../services/mfaService.js';
import { authenticateToken } from '../middleware/auth.js';
import { ApiResponse } from '../types/api.js';

const router = express.Router();

// Validation middleware
const validateMFAToken = [
  body('token')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Token must be a 6-digit number'),
];

const validateMFATokenOrBackup = [
  body('token')
    .isLength({ min: 6, max: 8 })
    .isAlphanumeric()
    .withMessage('Token must be a 6-digit number or 8-character backup code'),
];

/**
 * POST /api/mfa/setup
 * Generate MFA secret and QR code for user
 */
router.post('/setup', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    const result = await MFAService.setupMFA(userId);
    
    const response: ApiResponse<{
      qrCodeUrl: string;
      backupCodes: string[];
      secret: string;
    }> = {
      success: true,
      data: {
        qrCodeUrl: result.qrCodeUrl,
        backupCodes: result.backupCodes,
        secret: result.secret, // Only needed for manual entry
      },
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('MFA setup error:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: error.message || 'Failed to setup MFA',
    };
    
    res.status(400).json(response);
  }
});

/**
 * POST /api/mfa/enable
 * Enable MFA after verifying setup token
 */
router.post('/enable', authenticateToken, validateMFAToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid token format',
      };
      return res.status(400).json(response);
    }

    const userId = req.user!.id;
    const { token } = req.body;
    
    const result = await MFAService.enableMFA(userId, token);
    
    if (result.success) {
      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'MFA enabled successfully' },
      };
      res.json(response);
    } else {
      const response: ApiResponse<null> = {
        success: false,
        error: result.error || 'Failed to enable MFA',
      };
      res.status(400).json(response);
    }
  } catch (error: any) {
    console.error('MFA enable error:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to enable MFA',
    };
    
    res.status(500).json(response);
  }
});

/**
 * POST /api/mfa/disable
 * Disable MFA for user
 */
router.post('/disable', authenticateToken, validateMFATokenOrBackup, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid token format',
      };
      return res.status(400).json(response);
    }

    const userId = req.user!.id;
    const { token } = req.body;
    
    const result = await MFAService.disableMFA(userId, token);
    
    if (result.success) {
      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'MFA disabled successfully' },
      };
      res.json(response);
    } else {
      const response: ApiResponse<null> = {
        success: false,
        error: result.error || 'Failed to disable MFA',
      };
      res.status(400).json(response);
    }
  } catch (error: any) {
    console.error('MFA disable error:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to disable MFA',
    };
    
    res.status(500).json(response);
  }
});

/**
 * POST /api/mfa/verify
 * Verify MFA token during login (used by auth middleware)
 */
router.post('/verify', async (req, res) => {
  try {
    const { userId, token } = req.body;
    
    if (!userId || !token) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'User ID and token are required',
      };
      return res.status(400).json(response);
    }
    
    const result = await MFAService.verifyMFALogin(userId, token);
    
    if (result.success) {
      const response: ApiResponse<{ verified: boolean }> = {
        success: true,
        data: { verified: true },
      };
      res.json(response);
    } else {
      const response: ApiResponse<null> = {
        success: false,
        error: result.error || 'Invalid verification code',
      };
      res.status(400).json(response);
    }
  } catch (error: any) {
    console.error('MFA verification error:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to verify MFA token',
    };
    
    res.status(500).json(response);
  }
});

/**
 * POST /api/mfa/regenerate-backup-codes
 * Generate new backup codes for user
 */
router.post('/regenerate-backup-codes', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    const result = await MFAService.regenerateBackupCodes(userId);
    
    if (result.success) {
      const response: ApiResponse<{ backupCodes: string[] }> = {
        success: true,
        data: { backupCodes: result.codes! },
      };
      res.json(response);
    } else {
      const response: ApiResponse<null> = {
        success: false,
        error: result.error || 'Failed to regenerate backup codes',
      };
      res.status(400).json(response);
    }
  } catch (error: any) {
    console.error('Backup codes regeneration error:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to regenerate backup codes',
    };
    
    res.status(500).json(response);
  }
});

/**
 * GET /api/mfa/status
 * Get MFA status for current user
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const isEnabled = await MFAService.isMFAEnabled(userId);
    
    const response: ApiResponse<{ enabled: boolean }> = {
      success: true,
      data: { enabled: isEnabled },
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('MFA status error:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to get MFA status',
    };
    
    res.status(500).json(response);
  }
});

export default router;