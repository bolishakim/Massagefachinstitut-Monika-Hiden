# HTTPS Enforcement - Production Deployment Guide

## 🔒 Complete HTTPS Enforcement Implementation

This guide covers the complete HTTPS enforcement implementation for GDPR compliance in your Medical Center application.

## ✅ What Has Been Implemented

### 1. **Comprehensive HTTPS Enforcement Middleware**
- **Location**: `src/middleware/httpsEnforcement.ts`
- **Features**:
  - Automatic HTTP to HTTPS redirection
  - HSTS headers with configurable options
  - Development environment bypasses
  - Route-specific exemptions
  - Trust proxy support for load balancers

### 2. **Environment Configuration System**
- **Location**: `src/utils/envConfig.ts`
- **Features**:
  - Centralized configuration management
  - Production security validation
  - Environment-specific defaults
  - Security warnings and error checking

### 3. **Enhanced Security Headers**
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Cache control for sensitive data

### 4. **Secure Cookie Configuration**
- Production-enforced secure cookies
- HttpOnly flag for sensitive cookies
- SameSite strict policy
- Environment-driven configuration

## 🚀 Production Deployment Steps

### Step 1: Environment Configuration

Create a production `.env` file with these **required** settings:

```bash
# Production Environment
NODE_ENV=production

# Security (CRITICAL - Change these!)
JWT_SECRET=your-production-jwt-secret-minimum-64-characters-long-change-this
JWT_REFRESH_SECRET=your-production-refresh-secret-different-from-jwt-change-this

# HTTPS Enforcement
FORCE_HTTPS=true
REDIRECT_TO_HTTPS=true
HSTS_MAX_AGE=31536000
HSTS_INCLUDE_SUBDOMAINS=true
HSTS_PRELOAD=true

# Cookie Security
COOKIE_SECURE=true
COOKIE_SAME_SITE=strict
COOKIE_HTTP_ONLY=true

# CORS (Update for your domain)
CORS_ORIGIN=https://your-medical-center-domain.com

# Database
DATABASE_URL=postgresql://prod_user:secure_password@your-db-host:5432/medical_center_prod
```

### Step 2: SSL/TLS Certificate Setup

**Option A: Let's Encrypt (Recommended for cost-effectiveness)**
```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

**Option B: Commercial Certificate**
- Purchase from a trusted CA (DigiCert, GlobalSign, etc.)
- Follow provider's installation instructions

### Step 3: Web Server Configuration

**Nginx Configuration Example:**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    
    # Security Headers (additional to application headers)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    
    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3050;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 4: Application Startup

The application will automatically validate the configuration on startup:

```bash
# Production startup
NODE_ENV=production npm start
```

**Expected output:**
```
🔧 Loading and validating environment configuration...
✅ Production security configuration validated successfully
🔐 Security Configuration Status:
   📊 Environment: production
   🔒 HTTPS Enforced: ✅
   🍪 Secure Cookies: ✅
   🛡️  HSTS Enabled: ✅
🚀 Server running on port 3050
```

## 🛡️ Security Validation Checklist

### Pre-Deployment Verification

Run the built-in security test:
```bash
npm run test:security  # or npx tsx src/test/simpleHttpsTest.ts
```

### Production Security Checklist

- [ ] **SSL Certificate**: Valid and properly installed
- [ ] **HTTPS Redirect**: HTTP automatically redirects to HTTPS
- [ ] **HSTS Headers**: Present in response headers
- [ ] **Secure Cookies**: All authentication cookies have secure flag
- [ ] **CSP Headers**: Content Security Policy prevents XSS
- [ ] **Environment Variables**: All production secrets are updated
- [ ] **Database**: Uses SSL/TLS connection
- [ ] **Rate Limiting**: Configured appropriately for production load

## 🧪 Testing Your HTTPS Implementation

### 1. **SSL Labs Test**
Visit: https://www.ssllabs.com/ssltest/
Enter your domain and verify A+ rating.

### 2. **Security Headers Check**
Visit: https://securityheaders.com/
Verify all security headers are present.

### 3. **HSTS Preload Check**
Visit: https://hstspreload.org/
Submit your domain for HSTS preload list.

### 4. **Manual Testing**

```bash
# Test HTTP redirect
curl -I http://your-domain.com
# Should return 301/302 redirect to HTTPS

# Test HTTPS response
curl -I https://your-domain.com
# Should include HSTS and security headers

# Test API endpoints
curl -I https://your-domain.com/api/health
# Should be accessible over HTTPS only
```

## 🚨 Common Issues & Solutions

### Issue 1: "Mixed Content" Warnings
**Solution**: Ensure all resources (images, scripts, stylesheets) use HTTPS URLs or protocol-relative URLs.

### Issue 2: Proxy/Load Balancer Issues
**Solution**: Verify `X-Forwarded-Proto` headers are set correctly by your proxy.

### Issue 3: Cookie Issues
**Solution**: Ensure your domain matches the cookie domain and all cookies use secure flag in production.

### Issue 4: HSTS Not Working
**Solution**: Verify the domain was accessed over HTTPS at least once, and check browser developer tools.

## 📋 GDPR Compliance Verification

Your HTTPS implementation now provides:

- ✅ **Article 32 Compliance**: Technical measures for data security
- ✅ **Data in Transit Protection**: All communications encrypted
- ✅ **Security by Design**: Built-in security measures
- ✅ **Audit Trail**: Security events logged for compliance
- ✅ **Access Controls**: Enhanced authentication security

## 🔄 Maintenance & Updates

### SSL Certificate Renewal
If using Let's Encrypt:
```bash
# Test renewal
sudo certbot renew --dry-run

# Set up auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Security Updates
- Monitor security advisories for Node.js and dependencies
- Update TLS configurations annually
- Review and update HSTS max-age settings

## 📞 Support & Monitoring

### Monitoring Setup
Consider implementing:
- SSL certificate expiration monitoring
- HTTPS redirect monitoring
- Security header validation
- Failed authentication attempt alerts

### Production Logs
Monitor these log patterns:
- `[HTTPS Enforcement]` - HTTPS redirections
- `[Cookie Security]` - Cookie security warnings
- Failed SSL handshakes
- Mixed content warnings

---

## 🎉 Congratulations!

Your Medical Center application now has enterprise-grade HTTPS enforcement that meets GDPR requirements for technical and organizational measures. The implementation provides:

1. **Complete data in transit protection**
2. **Automated security policy enforcement** 
3. **Development-friendly configuration**
4. **Production-ready security measures**
5. **GDPR Article 32 compliance**

Your application is now ready for secure production deployment! 🚀🔒