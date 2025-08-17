/**
 * Environment Configuration Utility
 * Centralizes environment variable handling with validation and defaults
 * Ensures GDPR compliance requirements are met
 */
interface EnvironmentConfig {
    NODE_ENV: 'development' | 'production' | 'test';
    PORT: number;
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_EXPIRES_IN: string;
    JWT_REFRESH_EXPIRES_IN: string;
    BCRYPT_SALT_ROUNDS: number;
    FORCE_HTTPS: boolean;
    HSTS_MAX_AGE: number;
    HSTS_INCLUDE_SUBDOMAINS: boolean;
    HSTS_PRELOAD: boolean;
    REDIRECT_TO_HTTPS: boolean;
    COOKIE_SECURE: boolean;
    COOKIE_SAME_SITE: 'strict' | 'lax' | 'none';
    COOKIE_HTTP_ONLY: boolean;
    CORS_ORIGIN: string;
    RATE_LIMIT_WINDOW_MS: number;
    RATE_LIMIT_MAX: number;
    DATABASE_URL: string;
    AUDIT_LOG_RETENTION: number;
    SESSION_DATA_RETENTION: number;
    MEDICAL_DATA_RETENTION: number;
    TIMEZONE: string;
    DATA_CONTROLLER_NAME: string;
    DATA_CONTROLLER_EMAIL: string;
    DPO_EMAIL: string;
    DISABLE_HTTPS_REDIRECT: boolean;
    ALLOW_HTTP_HEALTH_CHECKS: boolean;
}
export declare const envConfig: EnvironmentConfig;
export default envConfig;
//# sourceMappingURL=envConfig.d.ts.map