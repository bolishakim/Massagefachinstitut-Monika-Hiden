# Database Reset Script

## Overview
This script completely resets the medical center database and creates a clean setup with 3 users and GDPR compliance policies.

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
| **ADMIN** | Dr. Admin Manager |   | `Admin123!` | Medical Massage |
| **MODERATOR** | Sarah Wilson | supervisor@medicalcenter.com | `Supervisor123!` | Physiotherapy |
| **USER** | Emma Johnson | staff@medicalcenter.com | `Staff123!` | Massage |

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
   - Access patient records
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

## Files Created/Modified

- `reset-database.js` - The main reset script
- `package.json` - Added `db:reset` npm script
- Database tables - All cleared and repopulated with base data