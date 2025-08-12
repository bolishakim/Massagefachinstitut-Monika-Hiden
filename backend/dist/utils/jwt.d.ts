export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
export declare class JWTUtils {
    private static getAccessTokenSecret;
    private static getRefreshTokenSecret;
    private static getAccessTokenExpiresIn;
    private static getRefreshTokenExpiresIn;
    static generateAccessToken(payload: TokenPayload): string;
    static generateTokenPair(payload: TokenPayload): TokenPair;
    static verifyAccessToken(token: string): TokenPayload;
    static verifyRefreshToken(token: string): {
        userId: string;
    };
    static generatePasswordResetToken(): string;
    static generateEmailVerificationToken(): string;
    static hashToken(token: string): string;
    static getTokenExpirationTime(token: string): Date | null;
    static isTokenExpired(token: string): boolean;
}
//# sourceMappingURL=jwt.d.ts.map