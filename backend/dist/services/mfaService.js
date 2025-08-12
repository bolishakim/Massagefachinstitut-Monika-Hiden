import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/db.js';
export class MFAService {
    static APP_NAME = 'Medical Center';
    static ENCRYPTION_KEY = process.env.MFA_ENCRYPTION_KEY || 'default-key-change-in-production';
    /**
     * Generate a new TOTP secret for a user
     */
    static generateSecret(userEmail) {
        return speakeasy.generateSecret({
            name: `${this.APP_NAME} (${userEmail})`,
            issuer: this.APP_NAME,
            length: 32,
        });
    }
    /**
     * Generate QR code URL for TOTP setup
     */
    static async generateQRCode(secret) {
        try {
            return await QRCode.toDataURL(secret);
        }
        catch (error) {
            throw new Error('Failed to generate QR code');
        }
    }
    /**
     * Verify TOTP token
     */
    static verifyToken(token, secret) {
        return speakeasy.totp.verify({
            secret,
            token,
            window: 2, // Allow 60s time drift
            encoding: 'base32',
        });
    }
    /**
     * Encrypt TOTP secret for database storage
     */
    static encryptSecret(secret) {
        const key = crypto.scryptSync(this.ENCRYPTION_KEY, 'salt', 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(secret, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        // Return IV + encrypted data
        return iv.toString('hex') + ':' + encrypted;
    }
    /**
     * Decrypt TOTP secret from database
     */
    static decryptSecret(encryptedSecret) {
        const key = crypto.scryptSync(this.ENCRYPTION_KEY, 'salt', 32);
        const [ivHex, encryptedHex] = encryptedSecret.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    /**
     * Generate backup codes for recovery
     */
    static generateBackupCodes(count = 10) {
        const codes = [];
        for (let i = 0; i < count; i++) {
            // Generate 8-character alphanumeric code
            const code = crypto.randomBytes(4).toString('hex').toUpperCase();
            codes.push(code);
        }
        return codes;
    }
    /**
     * Hash backup codes for secure storage
     */
    static async hashBackupCodes(codes) {
        const hashedCodes = await Promise.all(codes.map(code => bcrypt.hash(code, 12)));
        return hashedCodes;
    }
    /**
     * Verify backup code
     */
    static async verifyBackupCode(code, hashedCodes) {
        for (const hashedCode of hashedCodes) {
            if (await bcrypt.compare(code, hashedCode)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Setup MFA for a user (generate secret and backup codes)
     */
    static async setupMFA(userId) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { email: true, mfaEnabled: true }
            });
            if (!user) {
                throw new Error('User not found');
            }
            if (user.mfaEnabled) {
                throw new Error('MFA is already enabled for this user');
            }
            // Generate secret and QR code
            const secret = this.generateSecret(user.email);
            const qrCodeUrl = await this.generateQRCode(secret.otpauth_url);
            // Generate backup codes
            const backupCodes = this.generateBackupCodes();
            const hashedBackupCodes = await this.hashBackupCodes(backupCodes);
            // Encrypt secret for storage
            const encryptedSecret = this.encryptSecret(secret.base32);
            // Store in database (but don't enable MFA yet)
            await prisma.user.update({
                where: { id: userId },
                data: {
                    mfaSecret: encryptedSecret,
                    mfaBackupCodes: hashedBackupCodes,
                    mfaEnabled: false, // Will be enabled after verification
                },
            });
            return {
                secret: secret.base32,
                qrCodeUrl,
                backupCodes,
            };
        }
        catch (error) {
            console.error('MFA setup error:', error);
            throw error;
        }
    }
    /**
     * Enable MFA after successful token verification
     */
    static async enableMFA(userId, token) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { mfaSecret: true, mfaEnabled: true }
            });
            if (!user) {
                return { success: false, error: 'User not found' };
            }
            if (user.mfaEnabled) {
                return { success: false, error: 'MFA is already enabled' };
            }
            if (!user.mfaSecret) {
                return { success: false, error: 'MFA not set up. Please run setup first.' };
            }
            // Decrypt secret and verify token
            const decryptedSecret = this.decryptSecret(user.mfaSecret);
            const isValidToken = this.verifyToken(token, decryptedSecret);
            if (!isValidToken) {
                return { success: false, error: 'Invalid verification code' };
            }
            // Enable MFA
            await prisma.user.update({
                where: { id: userId },
                data: {
                    mfaEnabled: true,
                    mfaLastUsed: new Date(),
                },
            });
            return { success: true };
        }
        catch (error) {
            console.error('MFA enable error:', error);
            return { success: false, error: 'Failed to enable MFA' };
        }
    }
    /**
     * Disable MFA for a user
     */
    static async disableMFA(userId, token) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { mfaSecret: true, mfaEnabled: true, mfaBackupCodes: true }
            });
            if (!user) {
                return { success: false, error: 'User not found' };
            }
            if (!user.mfaEnabled) {
                return { success: false, error: 'MFA is not enabled' };
            }
            // Verify token or backup code
            let isValid = false;
            if (user.mfaSecret) {
                const decryptedSecret = this.decryptSecret(user.mfaSecret);
                isValid = this.verifyToken(token, decryptedSecret);
            }
            // If token failed, try backup codes
            if (!isValid && user.mfaBackupCodes.length > 0) {
                isValid = await this.verifyBackupCode(token, user.mfaBackupCodes);
            }
            if (!isValid) {
                return { success: false, error: 'Invalid verification code or backup code' };
            }
            // Disable MFA and clear secrets
            await prisma.user.update({
                where: { id: userId },
                data: {
                    mfaEnabled: false,
                    mfaSecret: null,
                    mfaBackupCodes: [],
                    mfaLastUsed: null,
                },
            });
            return { success: true };
        }
        catch (error) {
            console.error('MFA disable error:', error);
            return { success: false, error: 'Failed to disable MFA' };
        }
    }
    /**
     * Verify MFA token during login
     */
    static async verifyMFALogin(userId, token) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { mfaSecret: true, mfaEnabled: true, mfaBackupCodes: true }
            });
            if (!user) {
                return { success: false, error: 'User not found' };
            }
            if (!user.mfaEnabled) {
                return { success: false, error: 'MFA is not enabled for this user' };
            }
            // Verify TOTP token
            let isValid = false;
            let usedBackupCode = false;
            if (user.mfaSecret) {
                const decryptedSecret = this.decryptSecret(user.mfaSecret);
                isValid = this.verifyToken(token, decryptedSecret);
            }
            // If TOTP failed, try backup codes
            if (!isValid && user.mfaBackupCodes.length > 0) {
                isValid = await this.verifyBackupCode(token, user.mfaBackupCodes);
                if (isValid) {
                    usedBackupCode = true;
                }
            }
            if (!isValid) {
                return { success: false, error: 'Invalid verification code' };
            }
            // Update last used timestamp
            const updateData = {
                mfaLastUsed: new Date(),
            };
            // If backup code was used, remove it from the list
            if (usedBackupCode) {
                const remainingCodes = user.mfaBackupCodes.filter(async (hashedCode) => {
                    return !(await bcrypt.compare(token, hashedCode));
                });
                updateData.mfaBackupCodes = remainingCodes;
            }
            await prisma.user.update({
                where: { id: userId },
                data: updateData,
            });
            return { success: true };
        }
        catch (error) {
            console.error('MFA login verification error:', error);
            return { success: false, error: 'Failed to verify MFA token' };
        }
    }
    /**
     * Generate new backup codes for a user
     */
    static async regenerateBackupCodes(userId) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { mfaSecret: true, mfaEnabled: true }
            });
            if (!user) {
                return { success: false, error: 'User not found' };
            }
            if (!user.mfaEnabled) {
                return { success: false, error: 'MFA is not enabled' };
            }
            // Skip token verification for demo purposes
            // Generate new backup codes
            const backupCodes = this.generateBackupCodes();
            const hashedBackupCodes = await this.hashBackupCodes(backupCodes);
            // Update database
            await prisma.user.update({
                where: { id: userId },
                data: {
                    mfaBackupCodes: hashedBackupCodes,
                },
            });
            return { success: true, codes: backupCodes };
        }
        catch (error) {
            console.error('Backup codes regeneration error:', error);
            return { success: false, error: 'Failed to regenerate backup codes' };
        }
    }
    /**
     * Check if user has MFA enabled
     */
    static async isMFAEnabled(userId) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { mfaEnabled: true }
            });
            return user?.mfaEnabled || false;
        }
        catch (error) {
            console.error('MFA status check error:', error);
            return false;
        }
    }
}
//# sourceMappingURL=mfaService.js.map