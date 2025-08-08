# Modern Web Application Template

A comprehensive, full-stack web application template built with React 19, TypeScript, Node.js, Express, Prisma ORM, and PostgreSQL. Perfect foundation for any web application with user authentication.

## 🚀 Features

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Framer Motion
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: PostgreSQL with Docker setup
- **UI/UX**: Dark mode support + Glassmorphism design
- **Security**: JWT authentication + bcrypt + Helmet + Rate limiting
- **Validation**: Express-validator for input validation
- **Development**: Hot reload + ESLint + TypeScript strict mode

## 📁 Project Structure

```
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── ui/          # Base UI components
│   │   │   ├── forms/       # Form components
│   │   │   └── layout/      # Layout components
│   │   ├── pages/           # Route pages
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API calls
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Helper functions
│   │   └── styles/          # Global styles
│   └── package.json
├── backend/                  # Express backend API
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Helper functions
│   │   ├── types/           # TypeScript types
│   │   └── prisma/          # Database schema
│   └── package.json
├── database/                 # Database initialization
└── docker-compose.yml       # PostgreSQL setup
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (optional if using Docker)

### 1. Database Setup

Start PostgreSQL with Docker:
```bash
docker-compose up -d
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
# Edit .env if needed
npm install
npm run dev
```

## 🔧 Available Scripts

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📊 Database Schema

The template includes a comprehensive user authentication system:

- **Users**: Complete user management with role-based access control
  - Basic profile information (name, email, phone, avatar)
  - Authentication fields (password, email verification)
  - Session management (refresh tokens, last login)
  - Password reset functionality
- **Roles**: ADMIN, MODERATOR, USER with flexible permission system

## 🔐 Authentication & Authorization

- JWT-based authentication
- Role-based access control (ADMIN, MODERATOR, USER)
- Password hashing with bcrypt
- Rate limiting and security headers

## 🎨 UI/UX Features

- Responsive design with Tailwind CSS
- Dark/Light mode support
- Glassmorphism design elements
- Smooth animations with Framer Motion
- Accessible components with Headless UI

## 📈 Ready for Your Application

This template provides a solid foundation for any web application. You can now:

1. **Implement authentication controllers** - Login, register, password reset
2. **Add your business logic** - Create models and APIs for your specific domain
3. **Build UI components** - Leverage the existing design system
4. **Extend user features** - Profile management, settings, preferences
5. **Add application features** - Whatever your app needs!
6. **Implement file uploads** - Avatar uploads, document management
7. **Add notifications** - Email, push, or in-app notifications
8. **Create dashboards** - Analytics and reporting for your domain

## 🔧 Environment Variables

### Backend (.env)
```bash
DATABASE_URL=postgresql://practice_user:practice_password@localhost:5432/practice_management
NODE_ENV=development
PORT=3050
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3100
```

### Frontend (.env)
```bash
VITE_API_BASE_URL=http://localhost:3050/api
VITE_APP_NAME=Your Application Name
```

## 📄 License

This is a template for educational and development purposes.