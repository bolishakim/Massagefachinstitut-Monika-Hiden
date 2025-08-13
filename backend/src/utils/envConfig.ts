/**
 * Environment Configuration Utility
 * Centralizes environment variable handling with validation and defaults
 * Ensures GDPR compliance requirements are met
 */

// Ensure dotenv is loaded first
import dotenv from 'dotenv';
dotenv.config();

interface EnvironmentConfig {
  // Server Configuration
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  
  // Security Configuration
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  BCRYPT_SALT_ROUNDS: number;
  
  // HTTPS/TLS Configuration
  FORCE_HTTPS: boolean;
  HSTS_MAX_AGE: number;
  HSTS_INCLUDE_SUBDOMAINS: boolean;
  HSTS_PRELOAD: boolean;
  REDIRECT_TO_HTTPS: boolean;
  
  // Cookie Security
  COOKIE_SECURE: boolean;
  COOKIE_SAME_SITE: 'strict' | 'lax' | 'none';
  COOKIE_HTTP_ONLY: boolean;
  
  // CORS Configuration
  CORS_ORIGIN: string;
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX: number;
  
  // Database
  DATABASE_URL: string;
  
  // GDPR Compliance
  AUDIT_LOG_RETENTION: number;
  SESSION_DATA_RETENTION: number;
  MEDICAL_DATA_RETENTION: number;
  TIMEZONE: string;
  DATA_CONTROLLER_NAME: string;
  DATA_CONTROLLER_EMAIL: string;
  DPO_EMAIL: string;
  
  // Development flags
  DISABLE_HTTPS_REDIRECT: boolean;
  ALLOW_HTTP_HEALTH_CHECKS: boolean;
}

class EnvironmentValidator {
  private static getRequiredString(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }

  private static getOptionalString(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
  }

  private static getRequiredNumber(key: string): number {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      throw new Error(`Environment variable ${key} must be a valid number`);
    }
    return num;
  }

  private static getOptionalNumber(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (!value) return defaultValue;
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      console.warn(`Invalid number for ${key}, using default: ${defaultValue}`);
      return defaultValue;
    }
    return num;
  }

  private static getBooleanFlag(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  private static validateJWTSecret(secret: string, name: string): void {
    if (secret.length < 64) {
      console.warn(`⚠️  ${name} should be at least 64 characters for production security`);
    }
    if (process.env.NODE_ENV === 'production' && secret.includes('your-')) {
      throw new Error(`${name} must be changed from default value in production`);
    }
  }

  public static validateAndLoad(): EnvironmentConfig {
    console.log('🔧 Loading and validating environment configuration...');

    const NODE_ENV = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';
    const isProduction = NODE_ENV === 'production';

    // Critical security validation
    const JWT_SECRET = this.getRequiredString('JWT_SECRET');
    const JWT_REFRESH_SECRET = this.getRequiredString('JWT_REFRESH_SECRET');
    
    this.validateJWTSecret(JWT_SECRET, 'JWT_SECRET');
    this.validateJWTSecret(JWT_REFRESH_SECRET, 'JWT_REFRESH_SECRET');

    if (JWT_SECRET === JWT_REFRESH_SECRET) {
      throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different for security');
    }

    const config: EnvironmentConfig = {
      // Server Configuration
      NODE_ENV,
      PORT: this.getOptionalNumber('PORT', 3050),
      
      // Security Configuration
      JWT_SECRET,
      JWT_REFRESH_SECRET,
      JWT_EXPIRES_IN: this.getOptionalString('JWT_EXPIRES_IN', '15m'),
      JWT_REFRESH_EXPIRES_IN: this.getOptionalString('JWT_REFRESH_EXPIRES_IN', '7d'),
      BCRYPT_SALT_ROUNDS: this.getOptionalNumber('BCRYPT_SALT_ROUNDS', 12),
      
      // HTTPS/TLS Configuration
      FORCE_HTTPS: this.getBooleanFlag('FORCE_HTTPS', isProduction),
      HSTS_MAX_AGE: this.getOptionalNumber('HSTS_MAX_AGE', 31536000), // 1 year
      HSTS_INCLUDE_SUBDOMAINS: this.getBooleanFlag('HSTS_INCLUDE_SUBDOMAINS', true),
      HSTS_PRELOAD: this.getBooleanFlag('HSTS_PRELOAD', true),
      REDIRECT_TO_HTTPS: this.getBooleanFlag('REDIRECT_TO_HTTPS', isProduction),
      
      // Cookie Security
      COOKIE_SECURE: this.getBooleanFlag('COOKIE_SECURE', isProduction),
      COOKIE_SAME_SITE: (this.getOptionalString('COOKIE_SAME_SITE', 'strict') as 'strict' | 'lax' | 'none'),
      COOKIE_HTTP_ONLY: this.getBooleanFlag('COOKIE_HTTP_ONLY', true),
      
      // CORS Configuration
      CORS_ORIGIN: this.getOptionalString(
        'CORS_ORIGIN', 
        isProduction ? 'https://your-domain.com' : 'http://localhost:3100'
      ),
      
      // Rate Limiting
      RATE_LIMIT_WINDOW_MS: this.getOptionalNumber('RATE_LIMIT_WINDOW_MS', 300000), // 5 minutes
      RATE_LIMIT_MAX: this.getOptionalNumber('RATE_LIMIT_MAX', 1000),
      
      // Database
      DATABASE_URL: this.getRequiredString('DATABASE_URL'),
      
      // GDPR Compliance
      AUDIT_LOG_RETENTION: this.getOptionalNumber('AUDIT_LOG_RETENTION', 2555), // 7 years
      SESSION_DATA_RETENTION: this.getOptionalNumber('SESSION_DATA_RETENTION', 90),
      MEDICAL_DATA_RETENTION: this.getOptionalNumber('MEDICAL_DATA_RETENTION', 10950), // 30 years
      TIMEZONE: this.getOptionalString('TIMEZONE', 'Europe/Vienna'),
      DATA_CONTROLLER_NAME: this.getOptionalString('DATA_CONTROLLER_NAME', 'Medical Center'),
      DATA_CONTROLLER_EMAIL: this.getOptionalString('DATA_CONTROLLER_EMAIL', 'privacy@example.com'),
      DPO_EMAIL: this.getOptionalString('DPO_EMAIL', 'dpo@example.com'),
      
      // Development flags
      DISABLE_HTTPS_REDIRECT: this.getBooleanFlag('DISABLE_HTTPS_REDIRECT', false),
      ALLOW_HTTP_HEALTH_CHECKS: this.getBooleanFlag('ALLOW_HTTP_HEALTH_CHECKS', true),
    };

    // Production-specific validations
    if (isProduction) {
      this.validateProductionConfig(config);
    }

    console.log('✅ Environment configuration loaded successfully');
    this.logSecurityStatus(config);

    return config;
  }

  private static validateProductionConfig(config: EnvironmentConfig): void {
    console.log('🔒 Validating production security configuration...');

    const warnings: string[] = [];
    const errors: string[] = [];

    // HTTPS validation
    if (!config.FORCE_HTTPS) {
      errors.push('FORCE_HTTPS must be enabled in production for GDPR compliance');
    }

    if (!config.REDIRECT_TO_HTTPS) {
      warnings.push('REDIRECT_TO_HTTPS should be enabled in production');
    }

    // Cookie security validation
    if (!config.COOKIE_SECURE) {
      errors.push('COOKIE_SECURE must be enabled in production');
    }

    if (config.COOKIE_SAME_SITE !== 'strict') {
      warnings.push('COOKIE_SAME_SITE should be "strict" for maximum security');
    }

    // HSTS validation
    if (config.HSTS_MAX_AGE < 31536000) { // 1 year minimum
      warnings.push('HSTS_MAX_AGE should be at least 1 year (31536000) for production');
    }

    // CORS validation
    if (config.CORS_ORIGIN.includes('localhost')) {
      errors.push('CORS_ORIGIN must not include localhost in production');
    }

    // Rate limiting validation
    if (config.RATE_LIMIT_MAX > 5000) {
      warnings.push('RATE_LIMIT_MAX seems high for production, consider lowering');
    }

    // JWT expiration validation
    if (!config.JWT_EXPIRES_IN.includes('m')) {
      warnings.push('JWT_EXPIRES_IN should be in minutes (e.g., "15m") for production');
    }

    // Log warnings
    if (warnings.length > 0) {
      console.warn('⚠️  Production Configuration Warnings:');
      warnings.forEach(warning => console.warn(`   - ${warning}`));
    }

    // Throw errors
    if (errors.length > 0) {
      console.error('❌ Production Configuration Errors:');
      errors.forEach(error => console.error(`   - ${error}`));
      throw new Error('Production configuration validation failed. Fix the above errors.');
    }

    if (warnings.length === 0 && errors.length === 0) {
      console.log('✅ Production security configuration validated successfully');
    }
  }

  private static logSecurityStatus(config: EnvironmentConfig): void {
    console.log('\n🔐 Security Configuration Status:');
    console.log(`   📊 Environment: ${config.NODE_ENV}`);
    console.log(`   🔒 HTTPS Enforced: ${config.FORCE_HTTPS ? '✅' : '❌'}`);
    console.log(`   🍪 Secure Cookies: ${config.COOKIE_SECURE ? '✅' : '❌'}`);
    console.log(`   🛡️  HSTS Enabled: ${config.HSTS_MAX_AGE > 0 ? '✅' : '❌'}`);
    console.log(`   🌐 CORS Origin: ${config.CORS_ORIGIN}`);
    console.log(`   ⏱️  Rate Limit: ${config.RATE_LIMIT_MAX} req/${config.RATE_LIMIT_WINDOW_MS}ms`);
    console.log(`   📜 Audit Retention: ${config.AUDIT_LOG_RETENTION} days`);
    console.log(`   🏥 Medical Data Retention: ${config.MEDICAL_DATA_RETENTION} days`);
    console.log(`   🌍 Timezone: ${config.TIMEZONE}`);
    console.log('');
  }
}

// Export singleton instance
export const envConfig = EnvironmentValidator.validateAndLoad();
export default envConfig;