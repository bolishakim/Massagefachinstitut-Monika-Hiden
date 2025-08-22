# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a medical center management application for "Massagefachinstitut Monika Hiden", an Austrian massage therapy and physiotherapy practice. The application uses React/TypeScript frontend, Node.js/Express backend, and PostgreSQL database.

## Essential Commands

### Development
```bash
# Start all services (frontend, backend, database)
npm run dev

# Start services in split terminals (VS Code)
npm run dev:split

# Individual services
cd frontend && npm run dev  # Frontend on port 3100
cd backend && npm run dev   # Backend on port 3050
```

### Database Operations
```bash
cd backend
npm run db:migrate      # Run Prisma migrations
npm run db:push        # Push schema changes without migration
npm run db:seed        # Seed with sample data
npm run db:studio      # Open Prisma Studio GUI
```

### Code Quality
```bash
# Frontend
cd frontend && npm run lint

# Backend
cd backend && npm run lint
```

### Testing
```bash
# Backend tests with coverage
cd backend && npm test

# Run specific test file
cd backend && npm test -- path/to/test.spec.ts
```

## Architecture Overview

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router v6
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL with Docker
- **Authentication**: JWT with refresh tokens, TOTP for MFA

### Key Directories

**Frontend Structure:**
- `frontend/src/components/` - Reusable UI components organized by feature
- `frontend/src/pages/` - Route-based page components
- `frontend/src/services/` - API communication layer
- `frontend/src/store/` - Global state management
- `frontend/src/hooks/` - Custom React hooks

**Backend Structure:**
- `backend/src/controllers/` - Request handlers
- `backend/src/services/` - Business logic
- `backend/src/middleware/` - Express middleware
- `backend/src/routes/` - API route definitions
- `backend/prisma/` - Database schema and migrations

### Core Features

1. **Patient Management** - Austrian-specific fields (SVN, insurance types)
2. **Appointment System** - 15-minute time slots with room/staff assignment
3. **Service Categories** - Massage, physiotherapy, infrared, training
4. **Package Management** - Multi-session packages with payment tracking
5. **GDPR Compliance** - Complete data protection framework
6. **Multi-Factor Auth** - TOTP-based with backup codes
7. **Audit Logging** - Comprehensive activity tracking

### API Architecture

The backend follows a RESTful API pattern:
- Authentication endpoints: `/api/auth/*`
- Resource endpoints: `/api/patients`, `/api/appointments`, `/api/services`
- Protected routes require JWT in Authorization header
- Refresh token rotation for security

### Database Schema

Key models in Prisma schema:
- `User` - Authentication and role management
- `Patient` - Customer records with GDPR fields
- `Appointment` - Scheduling with staff/room assignment
- `Service` - Service catalog
- `Package` - Multi-session packages
- `Payment` - Financial transactions
- `AuditLog` - Compliance tracking

### Development Notes

1. **Port Configuration**:
   - Frontend: 3100
   - Backend: 3050
   - PostgreSQL: 5432
   - pgAdmin: 8080

2. **Environment Variables**:
   - Backend: `.env` file required (see `.env.example`)
   - Key variables: DATABASE_URL, JWT_SECRET, REFRESH_TOKEN_SECRET

3. **TypeScript Configuration**:
   - Strict mode enabled
   - Path aliases configured in both frontend and backend

4. **Calendar System**:
   - Currently implementing 15-minute time slot system
   - Recent work on appointment slot reservation
   - Uses date-fns with German locale

5. **Authentication Flow**:
   - Login returns access token (15min) and refresh token (7d)
   - Refresh token stored in httpOnly cookie
   - Role hierarchy: USER < MODERATOR < ADMIN

6. **GDPR Compliance**:
   - Consent management system
   - Data export/import functionality
   - Audit logging for all data operations
   - Right to erasure implementation