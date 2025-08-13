import { Request, Response, NextFunction } from 'express';
import envConfig from '../utils/envConfig.js';

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
export class HttpsEnforcementMiddleware {
  private options: Required<HttpsEnforcementOptions>;

  constructor(options: HttpsEnforcementOptions = {}) {
    this.options = {
      enabled: options.enabled ?? envConfig.FORCE_HTTPS,
      redirectToHttps: options.redirectToHttps ?? envConfig.REDIRECT_TO_HTTPS,
      hstsMaxAge: options.hstsMaxAge ?? envConfig.HSTS_MAX_AGE,
      hstsIncludeSubdomains: options.hstsIncludeSubdomains ?? envConfig.HSTS_INCLUDE_SUBDOMAINS,
      hstsPreload: options.hstsPreload ?? envConfig.HSTS_PRELOAD,
      allowedInsecureRoutes: options.allowedInsecureRoutes ?? (envConfig.ALLOW_HTTP_HEALTH_CHECKS ? ['/health', '/api/health'] : []),
      trustProxy: options.trustProxy ?? true
    };
  }

  /**
   * Main HTTPS enforcement middleware
   */
  public enforce() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Skip enforcement if disabled (development mode)
      if (!this.options.enabled) {
        return next();
      }

      // Check if route is exempt from HTTPS enforcement
      if (this.isRouteExempt(req.path)) {
        return next();
      }

      // Determine if connection is secure
      const isSecure = this.isConnectionSecure(req);

      // Set HSTS headers for secure connections
      if (isSecure) {
        this.setHstsHeaders(res);
        return next();
      }

      // Handle insecure connections
      if (this.options.redirectToHttps) {
        return this.redirectToHttps(req, res);
      } else {
        return this.blockInsecureRequest(res);
      }
    };
  }

  /**
   * Determine if the connection is secure
   */
  private isConnectionSecure(req: Request): boolean {
    // Check direct HTTPS connection
    if (req.secure) {
      return true;
    }

    // Check proxy forwarded protocol (for load balancers)
    if (this.options.trustProxy) {
      const forwardedProto = req.get('X-Forwarded-Proto');
      const forwardedSsl = req.get('X-Forwarded-Ssl');
      const cloudFrontProto = req.get('CloudFront-Forwarded-Proto');
      
      // Check various proxy headers
      if (forwardedProto === 'https' || 
          forwardedSsl === 'on' || 
          cloudFrontProto === 'https') {
        return true;
      }
    }

    // Check for development localhost (exempt from HTTPS requirement)
    if (envConfig.NODE_ENV === 'development') {
      const host = req.get('Host') || '';
      if (host.includes('localhost') || host.includes('127.0.0.1') || host.includes('::1')) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if route is exempt from HTTPS enforcement
   */
  private isRouteExempt(path: string): boolean {
    return this.options.allowedInsecureRoutes.some(route => 
      path === route || path.startsWith(route)
    );
  }

  /**
   * Set HSTS (HTTP Strict Transport Security) headers
   */
  private setHstsHeaders(res: Response): void {
    let hstsValue = `max-age=${this.options.hstsMaxAge}`;
    
    if (this.options.hstsIncludeSubdomains) {
      hstsValue += '; includeSubDomains';
    }
    
    if (this.options.hstsPreload) {
      hstsValue += '; preload';
    }

    res.setHeader('Strict-Transport-Security', hstsValue);
  }

  /**
   * Redirect HTTP requests to HTTPS
   */
  private redirectToHttps(req: Request, res: Response): void {
    const host = req.get('Host');
    if (!host) {
      return this.blockInsecureRequest(res);
    }

    // Build HTTPS URL
    const httpsUrl = `https://${host}${req.originalUrl}`;
    
    // Log the redirection for audit purposes
    console.log(`[HTTPS Enforcement] Redirecting ${req.method} ${req.originalUrl} to HTTPS`);
    
    // Perform redirect with 301 (permanent) for GET requests, 307 (temporary) for others
    const statusCode = req.method === 'GET' ? 301 : 307;
    
    res.status(statusCode).redirect(httpsUrl);
  }

  /**
   * Block insecure requests with error response
   */
  private blockInsecureRequest(res: Response): void {
    res.status(426).json({
      success: false,
      error: 'HTTPS Required',
      message: 'This endpoint requires a secure HTTPS connection for GDPR compliance',
      code: 'HTTPS_REQUIRED'
    });
  }

  /**
   * Create middleware for specific routes that require HTTPS
   */
  public static requireHttpsForRoute() {
    return (req: Request, res: Response, next: NextFunction) => {
      const middleware = new HttpsEnforcementMiddleware({ 
        enabled: true, // Always enforce for sensitive routes
        redirectToHttps: false // Block instead of redirect for API routes
      });
      
      return middleware.enforce()(req, res, next);
    };
  }

  /**
   * Enhanced security headers middleware
   */
  public static securityHeaders() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Set security headers for GDPR compliance
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Set cache control for sensitive data
      if (req.path.includes('/api/patients') || 
          req.path.includes('/api/gdpr') ||
          req.path.includes('/api/audit')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }

      next();
    };
  }

  /**
   * Cookie security enhancement middleware
   */
  public static enhanceCookieSecurity() {
    return (_req: Request, res: Response, next: NextFunction) => {
      const originalCookie = res.cookie.bind(res);
      
      res.cookie = function(name: string, value: any, options: any = {}) {
        // Force secure settings in production
        if (envConfig.NODE_ENV === 'production') {
          options.secure = true;
          options.httpOnly = true;
          options.sameSite = options.sameSite || 'strict';
        }
        
        // Enhanced security for sensitive cookies
        if (name.includes('token') || name.includes('session') || name.includes('auth')) {
          options.secure = envConfig.COOKIE_SECURE;
          options.httpOnly = envConfig.COOKIE_HTTP_ONLY;
          options.sameSite = envConfig.COOKIE_SAME_SITE;
          
          // Add secure flag warning in development
          if (envConfig.NODE_ENV === 'development' && !options.secure) {
            console.warn(`[Cookie Security] Warning: ${name} cookie is not secure in development`);
          }
        }
        
        return originalCookie.call(this, name, value, options);
      };

      next();
    };
  }
}

/**
 * Factory function for easy middleware creation
 */
export function createHttpsEnforcement(options?: HttpsEnforcementOptions) {
  const middleware = new HttpsEnforcementMiddleware(options);
  return middleware.enforce();
}

/**
 * Pre-configured middleware for different environments
 */
export const httpsEnforcement = {
  // Production-ready HTTPS enforcement
  production: createHttpsEnforcement({
    enabled: true,
    redirectToHttps: true,
    hstsMaxAge: 31536000, // 1 year
    hstsIncludeSubdomains: true,
    hstsPreload: true
  }),

  // Development-friendly configuration
  development: createHttpsEnforcement({
    enabled: false,
    redirectToHttps: false
  }),

  // Strict enforcement for sensitive endpoints
  strict: HttpsEnforcementMiddleware.requireHttpsForRoute(),

  // Additional security headers
  securityHeaders: HttpsEnforcementMiddleware.securityHeaders(),

  // Enhanced cookie security
  cookieSecurity: HttpsEnforcementMiddleware.enhanceCookieSecurity()
};

export default httpsEnforcement;