# Modern Web Application with AI Assistant

A comprehensive, production-ready full-stack web application featuring user authentication, role-based access control, and an integrated AI Assistant with multimodal capabilities. Built with modern technologies and best practices.

## 🚀 Features

### Core Application
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: PostgreSQL with Docker setup
- **Authentication**: Complete JWT-based auth system with refresh tokens
- **Authorization**: Role-based access control (ADMIN, MODERATOR, USER)
- **Security**: Helmet, CORS, rate limiting, password validation, bcrypt hashing
- **UI/UX**: Responsive design with dark/light mode support

### AI Assistant Integration
- **Multimodal Chat**: Text, voice, file, and image support
- **n8n Integration**: Webhook-based AI workflow processing
- **File Support**: PDF, images, audio files with metadata extraction
- **Voice Recording**: Browser-based audio recording with visualization
- **Real-time UI**: Typing indicators and modern chat interface
- **Context Awareness**: Automatic user context integration

### Development Experience
- **Development Tools**: Hot reload, ESLint, TypeScript strict mode
- **Smart Scripts**: Automated development server management
- **Docker Integration**: PostgreSQL and pgAdmin setup
- **Comprehensive Documentation**: Detailed setup and usage guides

## 📁 Project Structure

```
├── frontend/                          # React frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                   # Base UI components (Button, Input, Modal, etc.)
│   │   │   ├── forms/                # Authentication forms
│   │   │   ├── layout/               # App layout components
│   │   │   ├── assistant/            # AI Assistant chat components
│   │   │   └── modals/               # Modal dialogs
│   │   ├── pages/                    # Application pages
│   │   │   ├── Dashboard.tsx         # Main dashboard
│   │   │   ├── AssistantPage.tsx     # AI Assistant interface
│   │   │   ├── AuthPage.tsx          # Login/Register
│   │   │   ├── UserManagementPage.tsx # User administration
│   │   │   └── Settings.tsx          # User settings
│   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── useAuth.tsx           # Authentication state
│   │   │   ├── useAssistant.tsx      # AI Assistant state
│   │   │   ├── useFileUpload.tsx     # File handling
│   │   │   ├── useVoiceRecording.tsx # Audio recording
│   │   │   └── useTheme.tsx          # Theme management
│   │   ├── services/                 # API communication
│   │   │   ├── auth.ts               # Auth API calls
│   │   │   ├── user.ts               # User management
│   │   │   ├── assistant.ts          # AI Assistant service
│   │   │   └── api.ts                # Base API client
│   │   ├── types/                    # TypeScript definitions
│   │   ├── utils/                    # Helper functions
│   │   └── styles/                   # Global CSS and Tailwind
│   ├── LAYOUT_SYSTEM.md              # Layout documentation
│   ├── README_ASSISTANT.md           # AI Assistant setup guide
│   └── package.json
├── backend/                           # Express backend API
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.ts     # Authentication endpoints
│   │   │   └── userController.ts     # User management endpoints
│   │   ├── middleware/
│   │   │   ├── auth.ts               # JWT authentication
│   │   │   ├── validate.ts           # Request validation
│   │   │   ├── errorHandler.ts       # Error handling
│   │   │   └── notFound.ts           # 404 handler
│   │   ├── routes/
│   │   │   ├── auth.ts               # Auth routes
│   │   │   └── users.ts              # User routes
│   │   ├── utils/
│   │   │   ├── db.ts                 # Database connection
│   │   │   ├── jwt.ts                # JWT utilities
│   │   │   └── password.ts           # Password hashing
│   │   ├── types/                    # TypeScript definitions
│   │   └── index.ts                  # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma             # Database schema
│   │   ├── migrations/               # Database migrations
│   │   └── seed.ts                   # Database seeding
│   └── package.json
├── database/
│   └── init/                         # Database initialization scripts
├── docker-compose.yml                # PostgreSQL + pgAdmin setup
├── start-dev.js                      # Smart development server launcher
├── start-dev.sh                      # Alternative dev script
├── start-dev-vscode.sh              # VS Code optimized launcher
└── package.json                      # Root package configuration
```

## 🛠️ Quick Start

### Prerequisites

- **Node.js 18+** (for backend and frontend)
- **Docker & Docker Compose** (for PostgreSQL database)
- **Modern browser** (for AI Assistant features)

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd web-dev-app

# Install root dependencies
npm install
```

### 2. Database Setup

```bash
# Start PostgreSQL and pgAdmin with Docker
docker-compose up -d

# Verify database is running
docker-compose ps
```

**Database Access:**
- **PostgreSQL**: `localhost:5432`
- **pgAdmin**: `http://localhost:8080` (admin@practice.com / admin123)

### 3. Backend Configuration

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env file with your settings (see Environment Variables section)

# Generate Prisma client and run migrations
npm run db:generate
npm run db:migrate

# Optional: Seed the database with sample data
npm run db:seed
```

### 4. Frontend Configuration

```bash
cd frontend

# Install dependencies
npm install

# Create environment file (optional - has defaults)
cp .env.example .env
# Configure AI Assistant webhook URL if needed
```

### 5. Start Development Servers

**Option A: Automated (Recommended)**
```bash
# From project root - starts both frontend and backend
npm run dev
# or
npm start
```

**Option B: Manual**
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend  
cd frontend && npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:3100
- **Backend API**: http://localhost:3050
- **Health Check**: http://localhost:3050/health
- **Database Admin**: http://localhost:8080

## 🔧 Available Scripts

### Root Level
- `npm run dev` / `npm start` - Start both frontend and backend servers automatically
- `npm run dev:split` - Start servers with VS Code optimized terminal splitting
- `npm run dev:simple` - Simple bash script for starting servers

### Backend Scripts
- `npm run dev` - Start development server with hot reload (tsx watch)
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations in development
- `npm run db:deploy` - Deploy migrations to production
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:seed` - Populate database with sample data

### Frontend Scripts
- `npm run dev` - Start Vite development server with hot reload
- `npm run build` - Build for production (includes TypeScript compilation)
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality checks

## 🗄️ Database Schema

### User Model
The application includes a comprehensive user management system with:

**Core Fields:**
- `id` (UUID) - Primary key
- `email` (unique) - User email address
- `password` (hashed) - Secure password storage
- `firstName`, `lastName` - User name components
- `role` (enum) - ADMIN, MODERATOR, USER
- `isActive` (boolean) - Account status

**Profile Enhancement:**
- `avatar` (optional) - Profile picture URL
- `phone` (optional) - Contact number
- `timezone` (optional) - User timezone preference

**Security Features:**
- `resetPasswordToken` - For password reset flows
- `resetPasswordExpires` - Token expiration timestamp
- `emailVerified` - Email verification status
- `emailVerificationToken` - Verification token
- `refreshToken` (hashed) - JWT refresh token storage
- `lastLoginAt` - Track login history

### Database Operations
- **Migrations**: Automated with Prisma
- **Seeding**: Sample data population
- **Connection Pooling**: Optimized for production
- **Query Optimization**: Selective field retrieval

## 🔐 Security & Authentication

### JWT Authentication System
- **Access Tokens**: Short-lived (15 minutes) for API requests
- **Refresh Tokens**: Long-lived (7 days) for token renewal
- **Secure Storage**: httpOnly cookies for refresh tokens
- **Token Rotation**: New tokens on each refresh

### Security Measures
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Security Headers**: Helmet.js middleware
- **CORS Protection**: Configurable origin restrictions
- **Input Validation**: Express-validator and Zod schemas
- **SQL Injection Prevention**: Prisma ORM parameterized queries

### Authorization Levels
- **USER**: Basic application access, profile management
- **MODERATOR**: User management capabilities + USER permissions
- **ADMIN**: Full system access including user role management

## 🎨 Frontend Architecture

### Design System
- **Tailwind CSS**: Utility-first styling with custom component library
- **Theme Support**: Dark/light mode with system preference detection
- **Responsive Design**: Mobile-first approach with breakpoint management
- **Accessibility**: WCAG guidelines with focus management and ARIA labels

### Component Architecture
- **UI Components**: Reusable base components (Button, Input, Modal, etc.)
- **Layout System**: Responsive sidebar navigation with breadcrumbs
- **Form Handling**: Validation and error display patterns
- **State Management**: Context-based auth and theme management

### Animation & Interactions
- **Framer Motion**: Smooth page transitions and micro-interactions
- **Loading States**: Skeleton screens and progress indicators
- **Feedback Systems**: Toast notifications and form validation states

## 🤖 AI Assistant Integration

### Overview
The application includes a fully-featured AI Assistant with multimodal capabilities, designed to integrate with n8n workflows or other AI services.

### Features
- **Text Chat**: Real-time conversational interface
- **Voice Recording**: Browser-based audio recording with waveform visualization
- **File Upload**: Support for images, PDFs, audio files with automatic metadata extraction
- **Context Awareness**: Automatically includes user information and session data
- **Responsive Design**: Optimized for desktop and mobile devices

### Technical Implementation
- **Frontend Components**: Complete chat interface with typing indicators
- **File Processing**: Client-side metadata extraction and base64 encoding
- **Voice Handling**: WebRTC API integration for audio recording
- **Webhook Integration**: Configurable endpoint for AI processing
- **State Management**: React Context for chat history and settings

### Setup Instructions
1. Configure your n8n webhook URL in frontend environment variables
2. Set up an n8n workflow to handle the assistant payload format
3. Customize supported file types and size limits as needed

Detailed setup instructions are available in `frontend/README_ASSISTANT.md`.

## 🏗️ Application Pages

### Authentication (`/auth`)
- **Login/Register Forms**: Email and password authentication
- **Password Reset**: Secure token-based password recovery
- **Form Validation**: Client and server-side validation
- **Responsive Design**: Mobile-optimized authentication flows

### Dashboard (`/dashboard`) 
- **Welcome Interface**: User-specific dashboard content
- **Navigation Hub**: Quick access to all application features
- **Role-based Content**: Different views based on user permissions

### AI Assistant (`/assistant`)
- **Full-screen Chat Interface**: Claude/ChatGPT-style conversation UI
- **Multimodal Input**: Text, voice, file, and image support
- **Real-time Responses**: Live typing indicators and response streaming
- **Mobile Optimized**: Touch-friendly interface for mobile devices

### User Management (`/users`) - Admin/Moderator Only
- **User Listing**: Paginated user directory with search
- **Role Management**: Assign and modify user roles
- **Account Controls**: Activate/deactivate user accounts
- **Bulk Operations**: Efficient management of multiple users

### Settings (`/settings`)
- **Profile Management**: Update personal information and preferences
- **Theme Selection**: Dark/light mode and appearance settings
- **Account Security**: Password change and session management
- **Notification Preferences**: Customize alert and communication settings

## 🎯 Next Steps & Customization

This application provides a production-ready foundation. Here are suggested next steps:

### Immediate Customization
1. **Branding**: Update colors, logos, and styling in Tailwind config
2. **Environment Setup**: Configure all environment variables for your use case
3. **Database Content**: Add your domain-specific data models to Prisma schema
4. **AI Integration**: Connect your preferred AI service to the assistant webhook

### Feature Extensions
1. **File Management**: Implement file storage (AWS S3, Cloudinary, etc.)
2. **Email System**: Add email notifications using services like SendGrid
3. **Analytics**: Integrate tracking (Google Analytics, Mixpanel, etc.)
4. **API Extensions**: Build additional endpoints for your business logic
5. **Advanced Auth**: Add OAuth providers (Google, GitHub, etc.)
6. **Real-time Features**: Implement WebSocket for live updates

### Production Deployment
1. **Environment Configuration**: Set up production environment variables
2. **Database Migration**: Deploy to production PostgreSQL
3. **SSL Configuration**: Secure your application with HTTPS
4. **CDN Setup**: Optimize asset delivery
5. **Monitoring**: Add logging and error tracking (Sentry, LogRocket, etc.)

## ⚙️ Environment Configuration

### Backend Environment (.env)
```bash
# Database Configuration
DATABASE_URL=postgresql://practice_user:practice_password@localhost:5432/practice_management

# Server Configuration
NODE_ENV=development
PORT=3050

# Security
JWT_SECRET=your-very-secure-secret-key-here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS & Rate Limiting
CORS_ORIGIN=http://localhost:3100
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Frontend Environment (.env)
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3050/api
VITE_APP_NAME=Your Application Name

# AI Assistant Configuration (Optional)
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/assistant
VITE_MAX_FILE_SIZE=10485760
VITE_SUPPORTED_FILE_TYPES=.txt,.pdf,.jpg,.jpeg,.png,.mp3,.wav,.m4a

# Feature Toggles (Optional)
VITE_VOICE_ENABLED=true
VITE_FILE_UPLOAD_ENABLED=true
```

### Required Environment Setup

**Backend Required Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT token signing (use a strong, unique value)

**Frontend Required Variables:**
- `VITE_API_BASE_URL` - Backend API endpoint
- `VITE_N8N_WEBHOOK_URL` - Only required if using AI Assistant features

All other variables have sensible defaults and are optional for development.

## 🔍 API Endpoints

### Authentication Endpoints
```
POST /api/auth/register      - User registration
POST /api/auth/login         - User login
POST /api/auth/logout        - User logout
POST /api/auth/refresh       - Refresh access token
POST /api/auth/forgot-password - Request password reset
POST /api/auth/reset-password  - Reset password with token
POST /api/auth/verify-email    - Verify email address
GET  /api/auth/profile       - Get user profile
PUT  /api/auth/profile       - Update user profile
```

### User Management Endpoints (Admin/Moderator)
```
GET  /api/users              - List all users (paginated)
GET  /api/users/:id          - Get specific user
PUT  /api/users/:id          - Update user
DELETE /api/users/:id        - Delete user
PUT  /api/users/:id/role     - Update user role
PUT  /api/users/:id/status   - Activate/deactivate user
```

### Health & System
```
GET  /health                 - Server health check
```

All endpoints return consistent JSON responses with success/error status and appropriate HTTP status codes.

## 🛠️ Technology Stack

### Frontend Technologies
- **React 18** - Modern React with concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first styling framework
- **Framer Motion** - Advanced animations and gestures
- **React Router v6** - Client-side routing
- **Axios** - HTTP client with interceptors
- **Headless UI** - Unstyled, accessible UI components

### Backend Technologies
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **TypeScript** - Type-safe server development
- **Prisma ORM** - Type-safe database client
- **PostgreSQL** - Robust relational database
- **JWT** - Secure token-based authentication
- **bcryptjs** - Password hashing
- **Helmet** - Security middleware
- **Zod** - Runtime type validation

### Development & Deployment
- **Docker** - Containerized database setup
- **ESLint** - Code quality and consistency
- **Prettier** - Code formatting (recommended)
- **Git** - Version control
- **VS Code** - Recommended IDE with TypeScript support

## 🚨 Troubleshooting

### Common Issues

**Database Connection Errors**
```bash
# Ensure PostgreSQL is running
docker-compose ps

# Restart database services
docker-compose restart

# Check database logs
docker-compose logs postgres
```

**Port Already in Use**
```bash
# Kill processes on ports 3050 and 3100
npm run dev  # Automatically handles port cleanup
```

**Authentication Issues**
- Verify `JWT_SECRET` is set in backend environment
- Check that cookies are enabled in browser
- Ensure frontend and backend URLs match CORS settings

**AI Assistant Not Working**
- Verify `VITE_N8N_WEBHOOK_URL` is configured
- Check browser console for network errors
- Ensure n8n webhook is accessible and responding

**Build Failures**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf frontend/dist frontend/.vite
```

### Support & Documentation

- **Frontend Layout System**: See `frontend/LAYOUT_SYSTEM.md`
- **AI Assistant Setup**: See `frontend/README_ASSISTANT.md`
- **Component Documentation**: Check individual component README files
- **Database Schema**: Review `backend/prisma/schema.prisma`

## 📄 License

MIT License - This template is provided for educational and development purposes. Feel free to use, modify, and distribute according to your needs.