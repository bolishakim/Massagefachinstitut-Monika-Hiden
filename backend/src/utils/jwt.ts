import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class JWTUtils {
  private static getAccessTokenSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    return secret;
  }

  private static getRefreshTokenSecret(): string {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET environment variable is not set');
    }
    return secret;
  }

  private static getAccessTokenExpiresIn(): string {
    return process.env.JWT_EXPIRES_IN || '15m';
  }

  private static getRefreshTokenExpiresIn(): string {
    return process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  }

  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(
      payload,
      this.getAccessTokenSecret(),
      { expiresIn: this.getAccessTokenExpiresIn() }
    );
  }

  static generateTokenPair(payload: TokenPayload): TokenPair {
    const accessToken = this.generateAccessToken(payload);

    const refreshToken = jwt.sign(
      { userId: payload.userId },
      this.getRefreshTokenSecret(),
      { expiresIn: this.getRefreshTokenExpiresIn() }
    );

    return { accessToken, refreshToken };
  }

  static verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.getAccessTokenSecret()) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  static verifyRefreshToken(token: string): { userId: string } {
    try {
      return jwt.verify(token, this.getRefreshTokenSecret()) as { userId: string };
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  static generatePasswordResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static generateEmailVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static getTokenExpirationTime(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  static isTokenExpired(token: string): boolean {
    const expirationTime = this.getTokenExpirationTime(token);
    if (!expirationTime) return true;
    return new Date() > expirationTime;
  }
}