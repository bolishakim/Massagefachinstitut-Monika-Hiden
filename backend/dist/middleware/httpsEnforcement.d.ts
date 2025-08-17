import { Request, Response, NextFunction } from 'express';
interface HttpsEnforcementOptions {
    enabled?: boolean;
    redirectToHttps?: boolean;
    hstsMaxAge?: number;
    hstsIncludeSubdomains?: boolean;
    hstsPreload?: boolean;
    allowedInsecureRoutes?: string[];
    trustProxy?: boolean;
}
/**
 * Comprehensive HTTPS Enforcement Middleware for GDPR Compliance
 *
 * Features:
 * - Automatic HTTP to HTTPS redirection
 * - HSTS headers with configurable options
 * - Development environment bypasses
 * - Selective route exemptions
 * - Trust proxy support for load balancers
 *
 * GDPR Compliance:
 * - Ensures data in transit protection (Article 32)
 * - Implements appropriate technical measures
 * - Supports data security requirements
 */
export declare class HttpsEnforcementMiddleware {
    private options;
    constructor(options?: HttpsEnforcementOptions);
    /**
     * Main HTTPS enforcement middleware
     */
    enforce(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Determine if the connection is secure
     */
    private isConnectionSecure;
    /**
     * Check if route is exempt from HTTPS enforcement
     */
    private isRouteExempt;
    /**
     * Set HSTS (HTTP Strict Transport Security) headers
     */
    private setHstsHeaders;
    /**
     * Redirect HTTP requests to HTTPS
     */
    private redirectToHttps;
    /**
     * Block insecure requests with error response
     */
    private blockInsecureRequest;
    /**
     * Create middleware for specific routes that require HTTPS
     */
    static requireHttpsForRoute(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Enhanced security headers middleware
     */
    static securityHeaders(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Cookie security enhancement middleware
     */
    static enhanceCookieSecurity(): (_req: Request, res: Response, next: NextFunction) => void;
}
/**
 * Factory function for easy middleware creation
 */
export declare function createHttpsEnforcement(options?: HttpsEnforcementOptions): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Pre-configured middleware for different environments
 */
export declare const httpsEnforcement: {
    production: (req: Request, res: Response, next: NextFunction) => void;
    development: (req: Request, res: Response, next: NextFunction) => void;
    strict: (req: Request, res: Response, next: NextFunction) => void;
    securityHeaders: (req: Request, res: Response, next: NextFunction) => void;
    cookieSecurity: (_req: Request, res: Response, next: NextFunction) => void;
};
export default httpsEnforcement;
//# sourceMappingURL=httpsEnforcement.d.ts.map