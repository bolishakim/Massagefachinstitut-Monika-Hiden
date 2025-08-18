# Database Reset Script

## Overview
This script completely resets the medical center database and creates a clean setup with 3 users, 25 comprehensive medical services, and GDPR compliance policies.

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

### 👥 **User Creation**
Creates 3 users with different roles:

| Role | Name | Email | Password | Specialization |
|------|------|-------|----------|----------------|
| **ADMIN** | Dr. Admin Manager | admin@medicalcenter.com | `Admin123!` | Medical Massage |
| **MODERATOR** | Sarah Wilson | supervisor@medicalcenter.com | `Supervisor123!` | Physiotherapy |
| **USER** | Emma Johnson | staff@medicalcenter.com | `Staff123!` | Massage |

### 🏥 **Medical Services Setup**
Creates 25 comprehensive medical services with bilingual support (German/English):

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

2. **Login to the frontend** with any of the created user credentials

3. **Test the application**:
   - Create test patients
   - **Create service packages** using the 25 pre-loaded services
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

## Files Created/Modified

- `reset-database.js` - The main reset script with services integration
- `massage_services.sql` - Original SQL file with all services (reference only)
- `package.json` - Added `db:reset` npm script
- Database tables - All cleared and repopulated with users, services, and policies