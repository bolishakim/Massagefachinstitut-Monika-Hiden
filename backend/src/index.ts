// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

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
import serviceRoutes from './routes/services.js';
import roomRoutes from './routes/rooms.js';
import auditRoutes from './routes/audit.js';
import mfaRoutes from './routes/mfa.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import prisma from './utils/db.js';
import { connectionMonitor } from './utils/connectionMonitor.js';

const app = express();
const PORT = process.env.PORT || 3050;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration (must be before rate limiting to ensure CORS headers on rate-limited responses)
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3100',
  credentials: true,
}));

// Rate limiting - more lenient for development
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '300000'), // 5 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '1000'), // 1000 requests per window
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests
  skipFailedRequests: false,
  // Skip rate limiting in development
  skip: (req) => process.env.NODE_ENV === 'development' && req.ip === '::ffff:127.0.0.1' || req.ip === '127.0.0.1' || req.ip === '::1'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

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

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/patient-history', patientHistoryRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/mfa', mfaRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start connection monitoring
connectionMonitor.startMonitoring(2 * 60 * 1000); // Check every 2 minutes
connectionMonitor.startMemoryMonitoring(10 * 60 * 1000); // Log memory every 10 minutes

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