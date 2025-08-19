# Database Reset Script

## Overview
This script completely resets the medical center database and creates a clean setup with 8 staff users (username-based authentication), 24 comprehensive medical services, and GDPR compliance policies.

## Usage

### Method 1: Using npm script (recommended)
```bash
npm run db:reset
```

### Method 2: Direct execution
```bash
tsx reset-database.js
```

## What the script does

### 🧹 **Database Cleanup**
- Clears all tables in the correct order
- Respects foreign key constraints
- Removes all existing data safely

### 👥 **Staff User Creation**
Creates 8 real staff users with username-based authentication:

| Role | Name | Username | Password | Specialization |
|------|------|----------|----------|----------------|
| **ADMIN** | Monika Hiden | `monika.hiden` | `password123` | Medical Massage |
| **MODERATOR** | Hedra Ramandious | `hedra.ramandious` | `password123` | Physiotherapy |
| **USER** | Stefan Konrad | `stefan.konrad` | `password123` | Massage |
| **USER** | Simon Freisitzer | `simon.freisitzer` | `password123` | Massage |
| **USER** | Barbara Eckerstorfer | `barbara.eckerstorfer` | `password123` | Massage |
| **USER** | Stephan Hiden | `stephan.hiden` | `password123` | Massage |
| **USER** | Katharina Marchold | `katharina.marchold` | `password123` | Massage |
| **USER** | Flavius Null | `flavius.null` | `password123` | Massage |

**Authentication Features:**
- ✅ **Username-based login** - Staff login with `firstname.lastname` format
- ✅ **No email required** - Staff don't need email addresses yet
- ✅ **Consistent passwords** - All staff use `password123` for easy access
- ✅ **Role-based access** - 1 Admin, 1 Moderator, 6 regular staff members

### 🏥 **Medical Services Setup**
Creates 24 comprehensive medical services with bilingual support (German/English):

| Category | Services | Price Range | Duration |
|----------|----------|-------------|----------|
| **Basic Massage** | 7 services including partial, full body, healing massage | €24 - €58 | 30-60 min |
| **Specialized Massage** | 5 advanced techniques (reflexology, acupuncture, etc.) | €35 each | 30 min |
| **Lymphatic Drainage** | 3 drainage sessions | €35 - €63 | 30-60 min |
| **Physiotherapy** | 3 rehabilitation sessions | €48 - €96 | 30-60 min |
| **Specialized Treatments** | Dorn-Breuss spinal therapy | €65 - €90 | 60-90 min |
| **Wellness Services** | Heat therapy, moor packs | €14 each | 30 min |
| **Package Deals** | Combination treatments | €44 - €300 | 30-60 min |

**Features:**
- ✅ Bilingual names and descriptions (German/English)
- ✅ Proper categorization (MASSAGE, MEDICAL_MASSAGE, PHYSIOTHERAPY, INFRARED_CHAIR)
- ✅ Austrian pricing structure
- ✅ Services from real massage institute (massage-hiden.at)

### 📋 **GDPR Compliance Setup**
Creates retention policies for:
- **Patient records**: 30 years (Austrian Medical Practice Act)
- **Staff records**: 7 years (Employment Law)
- **Audit logs**: 7 years (GDPR compliance)
- **Consent records**: 7 years (GDPR requirements)

## Next Steps After Reset

1. **Start the backend server**:
   ```bash
   npm run dev
   ```

2. **Login to the frontend** with username and password:
   - **Username**: Any staff member's `firstname.lastname` (e.g., `monika.hiden`)
   - **Password**: `password123` (for all staff)

3. **Test the application**:
   - Create test patients
   - **Create service packages** using the 24 pre-loaded services
   - **Book appointments** with different massage and physiotherapy services
   - Access patient records
   - **Test the package management system** with real Austrian pricing
   - Check audit logging features
   - View GDPR compliance reports

## Safety Features

- ✅ **Foreign key handling** - Properly disables/enables constraints
- ✅ **Error handling** - Graceful error reporting and rollback
- ✅ **Interrupt handling** - Safe cleanup on Ctrl+C
- ✅ **Colored output** - Easy to read status messages
- ✅ **Comprehensive logging** - Shows exactly what's happening

## Austrian Healthcare Compliance

The script automatically sets up compliance with:
- **Austrian Medical Practice Act (ÄrzteG) § 51** - 30-year medical record retention
- **GDPR Articles 5, 7, 30** - Data protection and audit requirements
- **Austrian Employment Law** - 7-year staff record retention

## Troubleshooting

If the script fails:
1. Check database connection in `.env` file
2. Ensure PostgreSQL is running
3. Verify Prisma schema is up to date: `npx prisma generate`
4. Check for any foreign key constraint errors in the output

## Service Details

### Example Services Created:
- **Teilmassage 30 min** (Partial Massage) - €30
- **Ganzkörpermassage 60 min** (Full Body Massage) - €58
- **Lymphdrainage 45 min** (Lymphatic Drainage) - €52.50
- **Physiotherapie 60 min** (Physiotherapy) - €96
- **Dorn-Breuss Behandlung 90 min** - €90
- **Kombi: Tiefenwärmeliege + Teilmassage** - €44

All services include:
- English and German names
- Detailed descriptions in both languages
- Appropriate medical categories
- Realistic Austrian healthcare pricing

## Login Instructions

### Staff Authentication
All staff members can login using the new username-based system:

1. **Navigate to the login page**
2. **Enter Username**: Use `firstname.lastname` format
   - Examples: `monika.hiden`, `stefan.konrad`, `hedra.ramandious`
3. **Enter Password**: `password123` (same for all staff)
4. **Access Levels**:
   - **Monika Hiden (ADMIN)**: Full system access, user management, settings
   - **Hedra Ramandious (MODERATOR)**: Staff management, scheduling, reports
   - **All other staff (USER)**: Patient care, basic functionality, own profile

### Authentication Benefits
- ✅ **No email required** - Staff don't need email addresses yet
- ✅ **Simple format** - Easy to remember firstname.lastname pattern
- ✅ **Secure but accessible** - Consistent password for development/testing
- ✅ **Role-based permissions** - Different access levels based on staff role

## Files Created/Modified

- `reset-database.js` - The main reset script with 8 staff users and username authentication
- `massage_services.sql` - Original SQL file with all services (reference only)
- `package.json` - Added `db:reset` npm script
- Database tables - All cleared and repopulated with staff users, services, and policies
- Authentication system - Updated to support username-based login