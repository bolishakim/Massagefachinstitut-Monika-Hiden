// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

// Load and validate environment configuration
import envConfig from './utils/envConfig.js';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import patientRoutes from './routes/patients.js';
import patientHistoryRoutes from './routes/patientHistory.js';
import packageRoutes from './routes/packages.js';
import serviceRoutes from './routes/services.js';
import roomRoutes from './routes/rooms.js';
import auditRoutes from './routes/audit.js';
import mfaRoutes from './routes/mfa.js';
import gdprRoutes from './routes/gdpr.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { enhancedAuditMiddleware, patientAccessLogger } from './middleware/enhancedAuditMiddleware';
import httpsEnforcement from './middleware/httpsEnforcement.js';
import prisma from './utils/db.js';
import { connectionMonitor } from './utils/connectionMonitor.js';
import { DataRetentionJob } from './utils/dataRetentionJob.js';

const app = express();
const PORT = envConfig.PORT;

// Trust proxy for proper IP address detection
app.set('trust proxy', true);

// HTTPS enforcement and security headers (must be first)
app.use(httpsEnforcement.cookieSecurity);
app.use(httpsEnforcement.securityHeaders);

// Dynamic HTTPS enforcement based on environment
if (envConfig.FORCE_HTTPS) {
  app.use(httpsEnforcement.production);
} else {
  app.use(httpsEnforcement.development);
}

// Enhanced security middleware with HSTS
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    },
  },
  hsts: {
    maxAge: envConfig.HSTS_MAX_AGE,
    includeSubDomains: envConfig.HSTS_INCLUDE_SUBDOMAINS,
    preload: envConfig.HSTS_PRELOAD
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true
}));

// CORS configuration (must be before rate limiting to ensure CORS headers on rate-limited responses)
app.use(cors({
  origin: envConfig.CORS_ORIGIN,
  credentials: true,
}));

// Rate limiting - configured via environment
const limiter = rateLimit({
  windowMs: envConfig.RATE_LIMIT_WINDOW_MS,
  max: envConfig.RATE_LIMIT_MAX,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests
  skipFailedRequests: false,
  // Skip rate limiting in development
  skip: (req) => envConfig.NODE_ENV === 'development' && (req.ip === '::ffff:127.0.0.1' || req.ip === '127.0.0.1' || req.ip === '::1')
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// Enhanced audit logging middleware (after authentication middleware)
app.use('/api', enhancedAuditMiddleware);

// Health check endpoint with database connectivity
app.get('/health', async (req, res) => {
  try {
    const dbStats = await connectionMonitor.checkConnection();
    
    res.status(dbStats.isHealthy ? 200 : 503).json({
      status: dbStats.isHealthy ? 'OK' : 'ERROR',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStats.isHealthy ? 'connected' : 'disconnected',
      dbStats: {
        isHealthy: dbStats.isHealthy,
        lastCheck: dbStats.lastCheck,
        uptime: dbStats.uptime,
        failureCount: dbStats.failureCount,
        lastError: dbStats.lastError,
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'disconnected',
      error: 'Database connection failed',
    });
  }
});

// API routes with enhanced HTTPS enforcement for sensitive endpoints
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', httpsEnforcement.strict, patientRoutes);
app.use('/api/patient-history', httpsEnforcement.strict, patientHistoryRoutes);
app.use('/api/packages', httpsEnforcement.strict, packageRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/audit', httpsEnforcement.strict, auditRoutes);
app.use('/api/mfa', httpsEnforcement.strict, mfaRoutes);
app.use('/api/gdpr', httpsEnforcement.strict, gdprRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start connection monitoring
connectionMonitor.startMonitoring(2 * 60 * 1000); // Check every 2 minutes
connectionMonitor.startMemoryMonitoring(10 * 60 * 1000); // Log memory every 10 minutes

// Initialize GDPR compliance systems
DataRetentionJob.initializeRetentionPolicies();
DataRetentionJob.startCleanupJob();

// Initial database connection test
const initializeServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Handle server shutdown gracefully
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🔄 Received ${signal}, starting graceful shutdown...`);
      
      server.close(async (err) => {
        if (err) {
          console.error('❌ Error during server shutdown:', err);
          return process.exit(1);
        }
        
        console.log('🔄 Server closed');
        
        try {
          await prisma.$disconnect();
          console.log('✅ Database disconnected');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error disconnecting from database:', error);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1);
  }
};

// Initialize server
initializeServer().catch((error) => {
  console.error('❌ Failed to initialize server:', error);
  process.exit(1);
});