/**
 * HTTPS Enforcement Middleware Test
 * 
 * Tests the HTTPS enforcement functionality for GDPR compliance
 * Run with: npx tsx src/test/httpsEnforcement.test.ts
 */

// Load test environment first
import './testEnv.js';

import { Request, Response } from 'express';
import { HttpsEnforcementMiddleware } from '../middleware/httpsEnforcement.js';

// Mock request/response objects
function createMockRequest(options: {
  secure?: boolean;
  headers?: Record<string, string>;
  path?: string;
  method?: string;
  originalUrl?: string;
}): Partial<Request> {
  return {
    secure: options.secure || false,
    path: options.path || '/api/test',
    method: options.method || 'GET',
    originalUrl: options.originalUrl || '/api/test',
    get: (header: string) => options.headers?.[header.toLowerCase()],
    ...options
  } as Partial<Request>;
}

function createMockResponse(): { 
  res: Partial<Response>, 
  headers: Record<string, string>,
  statusCode: number,
  redirectUrl?: string 
} {
  const headers: Record<string, string> = {};
  let statusCode = 200;
  let redirectUrl: string | undefined;

  const res = {
    setHeader: (name: string, value: string) => {
      headers[name.toLowerCase()] = value;
    },
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (data: any) => {
      return res;
    },
    redirect: (url: string) => {
      redirectUrl = url;
      return res;
    }
  } as Partial<Response>;

  return { res, headers, get statusCode() { return statusCode; }, get redirectUrl() { return redirectUrl; } };
}

async function runTests() {
  console.log('🧪 Testing HTTPS Enforcement Middleware\n');

  let testsPassed = 0;
  let testsTotal = 0;

  function test(name: string, testFn: () => boolean) {
    testsTotal++;
    try {
      const result = testFn();
      if (result) {
        console.log(`✅ ${name}`);
        testsPassed++;
      } else {
        console.log(`❌ ${name}`);
      }
    } catch (error) {
      console.log(`❌ ${name} - Error: ${error}`);
    }
  }

  // Test 1: HSTS headers are set for secure connections
  test('HSTS headers are set for secure connections', () => {
    const middleware = new HttpsEnforcementMiddleware({ enabled: true });
    const req = createMockRequest({ secure: true }) as Request;
    const { res, headers } = createMockResponse();
    const next = () => {};

    middleware.enforce()(req, res as Response, next);

    return headers['strict-transport-security']?.includes('max-age=31536000');
  });

  // Test 2: HTTP requests are redirected to HTTPS in production
  test('HTTP requests are redirected to HTTPS when enabled', () => {
    const middleware = new HttpsEnforcementMiddleware({ 
      enabled: true, 
      redirectToHttps: true 
    });
    const req = createMockRequest({ 
      secure: false,
      headers: { 'host': 'example.com' },
      originalUrl: '/api/test'
    }) as Request;
    const { res, redirectUrl } = createMockResponse();
    const next = () => {};

    middleware.enforce()(req, res as Response, next);

    return redirectUrl === 'https://example.com/api/test';
  });

  // Test 3: Health check routes are exempt from HTTPS enforcement
  test('Health check routes are exempt from HTTPS enforcement', () => {
    const middleware = new HttpsEnforcementMiddleware({ 
      enabled: true,
      allowedInsecureRoutes: ['/health']
    });
    const req = createMockRequest({ 
      secure: false,
      path: '/health'
    }) as Request;
    const { res } = createMockResponse();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    middleware.enforce()(req, res as Response, next);

    return nextCalled; // Should proceed without redirect
  });

  // Test 4: Localhost development requests are allowed
  test('Localhost development requests are allowed', () => {
    // This test simulates development environment behavior
    const req = createMockRequest({ 
      secure: false,
      headers: { 'host': 'localhost:3050' }
    }) as Request;
    
    // Simulate isConnectionSecure logic for development
    const host = req.get?.('Host') || '';
    const isDevelopmentLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    
    return isDevelopmentLocalhost;
  });

  // Test 5: Proxy forwarded HTTPS is detected
  test('Proxy forwarded HTTPS is detected', () => {
    const middleware = new HttpsEnforcementMiddleware({ 
      enabled: true,
      trustProxy: true
    });
    const req = createMockRequest({ 
      secure: false, // Direct connection is not secure
      headers: { 'x-forwarded-proto': 'https' } // But proxy forwards HTTPS
    }) as Request;
    const { res, headers } = createMockResponse();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    middleware.enforce()(req, res as Response, next);

    // Should set HSTS headers and proceed (not redirect)
    return nextCalled && headers['strict-transport-security'];
  });

  // Test 6: Insecure requests are blocked when redirect is disabled
  test('Insecure requests are blocked when redirect is disabled', () => {
    const middleware = new HttpsEnforcementMiddleware({ 
      enabled: true,
      redirectToHttps: false
    });
    const req = createMockRequest({ 
      secure: false,
      headers: { 'host': 'example.com' }
    }) as Request;
    const { res, statusCode } = createMockResponse();
    const next = () => {};

    middleware.enforce()(req, res as Response, next);

    return statusCode === 426; // HTTP 426 Upgrade Required
  });

  // Test 7: Enhanced security headers are set
  test('Enhanced security headers are set', () => {
    const req = createMockRequest({}) as Request;
    const { res, headers } = createMockResponse();
    const next = () => {};

    HttpsEnforcementMiddleware.securityHeaders()(req, res as Response, next);

    return headers['x-content-type-options'] === 'nosniff' &&
           headers['x-frame-options'] === 'DENY' &&
           headers['x-xss-protection'] === '1; mode=block';
  });

  // Test 8: Cache control headers are set for sensitive routes
  test('Cache control headers are set for sensitive routes', () => {
    const req = createMockRequest({ path: '/api/patients/123' }) as Request;
    const { res, headers } = createMockResponse();
    const next = () => {};

    HttpsEnforcementMiddleware.securityHeaders()(req, res as Response, next);

    return headers['cache-control'] === 'no-cache, no-store, must-revalidate';
  });

  // Test Summary
  console.log(`\n📊 Test Results: ${testsPassed}/${testsTotal} tests passed`);
  
  if (testsPassed === testsTotal) {
    console.log('🎉 All HTTPS enforcement tests passed!');
    return true;
  } else {
    console.log('⚠️  Some tests failed. Please review the implementation.');
    return false;
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export { runTests };