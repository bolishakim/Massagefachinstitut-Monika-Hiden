import jwt from 'jsonwebtoken';
import crypto from 'crypto';
export class JWTUtils {
    static getAccessTokenSecret() {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET environment variable is not set');
        }
        return secret;
    }
    static getRefreshTokenSecret() {
        const secret = process.env.JWT_REFRESH_SECRET;
        if (!secret) {
            throw new Error('JWT_REFRESH_SECRET environment variable is not set');
        }
        return secret;
    }
    static getAccessTokenExpiresIn() {
        return process.env.JWT_EXPIRES_IN || '15m';
    }
    static getRefreshTokenExpiresIn() {
        return process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    }
    static generateAccessToken(payload) {
        return jwt.sign(payload, this.getAccessTokenSecret(), { expiresIn: this.getAccessTokenExpiresIn() });
    }
    static generateTokenPair(payload) {
        const accessToken = this.generateAccessToken(payload);
        const refreshToken = jwt.sign({ userId: payload.userId }, this.getRefreshTokenSecret(), { expiresIn: this.getRefreshTokenExpiresIn() });
        return { accessToken, refreshToken };
    }
    static verifyAccessToken(token) {
        try {
            return jwt.verify(token, this.getAccessTokenSecret());
        }
        catch (error) {
            throw new Error('Invalid or expired access token');
        }
    }
    static verifyRefreshToken(token) {
        try {
            return jwt.verify(token, this.getRefreshTokenSecret());
        }
        catch (error) {
            throw new Error('Invalid or expired refresh token');
        }
    }
    static generatePasswordResetToken() {
        return crypto.randomBytes(32).toString('hex');
    }
    static generateEmailVerificationToken() {
        return crypto.randomBytes(32).toString('hex');
    }
    static hashToken(token) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
    static getTokenExpirationTime(token) {
        try {
            const decoded = jwt.decode(token);
            if (decoded && decoded.exp) {
                return new Date(decoded.exp * 1000);
            }
            return null;
        }
        catch (error) {
            return null;
        }
    }
    static isTokenExpired(token) {
        const expirationTime = this.getTokenExpirationTime(token);
        if (!expirationTime)
            return true;
        return new Date() > expirationTime;
    }
}
//# sourceMappingURL=jwt.js.map