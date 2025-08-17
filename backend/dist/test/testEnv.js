/**
 * Test Environment Configuration
 * Sets up minimal environment variables for testing
 */
// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-minimum-64-characters-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-different-from-jwt-for-testing-purposes';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.PORT = '3050';
process.env.CORS_ORIGIN = 'http://localhost:3100';
// HTTPS/Security test settings
process.env.FORCE_HTTPS = 'false';
process.env.REDIRECT_TO_HTTPS = 'true';
process.env.HSTS_MAX_AGE = '31536000';
process.env.HSTS_INCLUDE_SUBDOMAINS = 'true';
process.env.HSTS_PRELOAD = 'true';
process.env.COOKIE_SECURE = 'false';
process.env.COOKIE_SAME_SITE = 'strict';
process.env.COOKIE_HTTP_ONLY = 'true';
export {};
//# sourceMappingURL=testEnv.js.map