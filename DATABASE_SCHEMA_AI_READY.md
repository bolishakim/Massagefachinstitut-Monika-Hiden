# Database Schema for AI Agent
**Massagefachinstitut Monika Hiden - Medical Center Management System**

*Generated from actual PostgreSQL schema - Updated: 2025-08-22*

This document provides the actual database schema extracted from the live PostgreSQL database for the Austrian massage therapy and physiotherapy center management system.

---

## 🏥 System Overview

This is a comprehensive medical center management system designed for Austrian healthcare providers, with full GDPR compliance, multi-language support (German), and specialized features for massage therapy, physiotherapy, and healing massage services.

**Currency**: EUR (Euro)  
**Locale**: Austria (AT)  
**Language**: German (primary)  
**Compliance**: GDPR, Austrian healthcare regulations

---

## 📊 Database Schema Summary

- **15 Core Tables** + 1 migration table
- **11 Enum Types** with predefined values
- **Full GDPR Compliance** with audit trails
- **Multi-factor Authentication** support
- **Staff Schedule Management** with Austrian labor law compliance
- **Package/Voucher System** for treatment bundles

---

## 🔢 ENUM TYPES

### AppointmentStatus
```sql
'SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'
```

### AuditAction  
```sql
'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 
'TOKEN_REFRESH', 'TOKEN_REFRESH_FAILED', 'VIEW_LIST', 'VIEW_DETAILED', 
'EXPORT', 'UNKNOWN'
```

### ConsentType (GDPR)
```sql
'NECESSARY', 'SYSTEM_OPTIMIZATION', 'NOTIFICATIONS', 'AUDIT_MONITORING'
```

### DataRequestStatus (GDPR)
```sql
'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED'
```

### DataRequestType (GDPR)
```sql
'EXPORT', 'DELETE', 'RESTRICT'
```

### GDPRAction
```sql
'DATA_ACCESS', 'DATA_EXPORT', 'DATA_MODIFICATION', 'DATA_DELETION',
'CONSENT_GIVEN', 'CONSENT_WITHDRAWN', 'PROCESSING_RESTRICTED'
```

### InsuranceType (Austrian Insurance System)
```sql
'PUBLIC_INSURANCE', 'PRIVATE_INSURANCE', 'SELF_PAY'
```

### NotificationType
```sql
'APPOINTMENT_REMINDER', 'PAYMENT_DUE', 'STAFF_LEAVE_REQUEST',
'PACKAGE_EXPIRING', 'SYSTEM_ALERT', 'APPOINTMENT_CONFLICT'
```

### PackageStatus
```sql
'ACTIVE', 'COMPLETED', 'CANCELLED'
```

### PaymentMethod
```sql
'CASH', 'CARD', 'BANK_TRANSFER'
```

### PaymentStatus
```sql
'PENDING', 'COMPLETED', 'REFUNDED', 'NONE', 'PARTIALLY_PAID'
```

### Role (User Access Levels)
```sql
'ADMIN', 'MODERATOR', 'USER'
```

### ServiceCategory (Treatment Types)
```sql
'MASSAGE', 'PHYSIOTHERAPY', 'INFRARED_CHAIR', 'TRAINING',
'HEILMASSAGE', 'COMBINATION', 'VOUCHER'
```

### StaffSpecialization
```sql
'MASSAGE', 'PHYSIOTHERAPY', 'INFRARED_CHAIR', 'TRAINING',
'HEILMASSAGE', 'MEDICAL_MASSAGE'
```

---

## 📋 TABLE DEFINITIONS

## 1. USERS
**Purpose**: Staff members, administrators, and system users  
**Key Features**: Multi-factor authentication, role-based access, staff specializations

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | text | NO | - | Primary key (UUID) |
| `email` | text | YES | - | Email (optional for staff) |
| `username` | text | YES | - | Username for login |
| `password` | text | NO | - | Hashed password |
| `firstName` | text | NO | - | First name |
| `lastName` | text | NO | - | Last name |
| `role` | Role | NO | 'USER' | Access level |
| `specialization` | StaffSpecialization | YES | - | Staff expertise area |
| `isActive` | boolean | NO | true | Account status |
| `phone` | text | YES | - | Phone number |
| `timezone` | text | YES | - | User timezone |
| `avatar` | text | YES | - | Profile picture URL |
| `emailVerified` | boolean | NO | false | Email verification status |
| `mfaEnabled` | boolean | NO | false | Multi-factor auth enabled |
| `mfaSecret` | text | YES | - | TOTP secret (encrypted) |
| `mfaBackupCodes` | text[] | YES | - | Backup codes (hashed) |
| `mfaLastUsed` | timestamp | YES | - | Last MFA usage |
| `refreshToken` | text | YES | - | JWT refresh token |
| `lastLoginAt` | timestamp | YES | - | Last login timestamp |
| `resetPasswordToken` | text | YES | - | Password reset token |
| `resetPasswordExpires` | timestamp | YES | - | Reset token expiry |
| `emailVerificationToken` | text | YES | - | Email verification token |
| `createdAt` | timestamp | NO | CURRENT_TIMESTAMP | Creation time |
| `updatedAt` | timestamp | NO | - | Last update time |

**Unique Constraints**: email, username

### SQL Examples for USERS:

**Create New Staff User:**
```sql
INSERT INTO users (
    id, username, password, "firstName", "lastName", 
    role, specialization, email, phone, "isActive", 
    "emailVerified", "mfaEnabled", "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid(),
    'maria.therapist',
    '$2b$10$YourHashedPasswordHere',
    'Maria',
    'Müller',
    'USER',
    'MASSAGE',
    'maria.mueller@massageinstitut.at',
    '+43 664 1234567',
    true,
    false,
    false,
    NOW(),
    NOW()
);
```

**Create Admin User:**
```sql
INSERT INTO users (
    id, username, password, "firstName", "lastName", 
    role, email, "isActive", "emailVerified", "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid(),
    'admin.schmidt',
    '$2b$10$YourHashedPasswordHere',
    'Johann',
    'Schmidt',
    'ADMIN',
    'admin@massageinstitut.at',
    true,
    true,
    NOW(),
    NOW()
);
```

**Query Active Staff by Specialization:**
```sql
SELECT 
    id, "firstName", "lastName", username, specialization, role
FROM users 
WHERE "isActive" = true 
AND specialization = 'PHYSIOTHERAPY'
ORDER BY "lastName", "firstName";
```

**Find User by Email or Username:**
```sql
SELECT 
    id, "firstName", "lastName", email, username, role, "lastLoginAt"
FROM users 
WHERE (email = 'maria.mueller@massageinstitut.at' OR username = 'maria.therapist')
AND "isActive" = true;
```

---

## 2. PATIENTS
**Purpose**: Patient/customer records and information  
**Key Features**: Austrian social insurance integration, GDPR compliant

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | text | NO | - | Primary key (UUID) |
| `firstName` | text | NO | - | Patient first name |
| `lastName` | text | NO | - | Patient last name |
| `dateOfBirth` | timestamp | YES | - | Birth date |
| `email` | text | YES | - | Email address |
| `phone` | text | NO | - | Phone number |
| `address` | text | YES | - | Full address |
| `socialInsuranceNumber` | text | YES | - | Austrian social insurance ID |
| `notes` | text | YES | - | Medical notes |
| `doctorReferral` | text | YES | - | Doctor referral information |
| `insuranceType` | InsuranceType | YES | - | Insurance category |
| `isActive` | boolean | NO | true | Patient status |
| `createdAt` | timestamp | NO | CURRENT_TIMESTAMP | Creation time |
| `updatedAt` | timestamp | NO | - | Last update time |
| `createdById` | text | NO | - | FK→users.id |
| `modifiedById` | text | YES | - | FK→users.id |

**Unique Constraints**: email, phone, socialInsuranceNumber

### SQL Examples for PATIENTS:

**Create New Patient:**
```sql
INSERT INTO patients (
    id, "firstName", "lastName", phone, email, "dateOfBirth",
    address, "socialInsuranceNumber", "insuranceType", notes,
    "doctorReferral", "isActive", "createdAt", "updatedAt", "createdById"
) VALUES (
    gen_random_uuid(),
    'Johann',
    'Weber',
    '+43 1 234 5678',
    'johann.weber@email.at',
    '1980-05-15'::timestamp,
    'Hauptstraße 123, 1010 Wien',
    '1234567890',
    'PUBLIC_INSURANCE',
    'Rückenschmerzen, keine Allergien',
    'Dr. Schmidt - Überweisung für Massage',
    true,
    NOW(),
    NOW(),
    (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1)
);
```

**Find Patient by Phone:**
```sql
SELECT 
    id, "firstName", "lastName", phone, email, "insuranceType"
FROM patients 
WHERE phone = '+43 1 234 5678' 
AND "isActive" = true;
```

**Search Patients by Name:**
```sql
SELECT 
    id, "firstName", "lastName", phone, email, "dateOfBirth"
FROM patients 
WHERE "isActive" = true 
AND (LOWER("firstName") LIKE LOWER('%johann%') OR LOWER("lastName") LIKE LOWER('%weber%'))
ORDER BY "lastName", "firstName";
```

**Get Patient with Creator Info:**
```sql
SELECT 
    p.id, p."firstName", p."lastName", p.phone, p.email,
    p."insuranceType", p."createdAt",
    u."firstName" || ' ' || u."lastName" as created_by
FROM patients p
JOIN users u ON p."createdById" = u.id
WHERE p.id = 'patient-uuid-here';
```

---

## 3. APPOINTMENTS
**Purpose**: Scheduled treatments and bookings  
**Key Features**: Conflict detection, multi-resource scheduling

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | text | NO | - | Primary key (UUID) |
| `patientId` | text | NO | - | FK→patients.id |
| `staffId` | text | NO | - | FK→users.id |
| `serviceId` | text | NO | - | FK→services.id |
| `roomId` | text | NO | - | FK→rooms.id |
| `packageId` | text | YES | - | FK→packages.id (if using package) |
| `scheduledDate` | timestamp | NO | - | Appointment date |
| `startTime` | text | NO | - | Start time (HH:MM format) |
| `endTime` | text | NO | - | End time (HH:MM format) |
| `status` | AppointmentStatus | NO | 'SCHEDULED' | Appointment status |
| `notes` | text | YES | - | Appointment notes |
| `hasConflict` | boolean | NO | false | Conflict detection flag |
| `conflictReason` | text | YES | - | Reason for conflict |
| `isVisible` | boolean | NO | true | Display in calendar |
| `createdAt` | timestamp | NO | CURRENT_TIMESTAMP | Creation time |
| `updatedAt` | timestamp | NO | - | Last update time |
| `createdById` | text | NO | - | FK→users.id |
| `modifiedById` | text | YES | - | FK→users.id |

### SQL Examples for APPOINTMENTS:

**Create New Appointment:**
```sql
INSERT INTO appointments (
    id, "patientId", "staffId", "serviceId", "roomId",
    "scheduledDate", "startTime", "endTime", status, notes,
    "hasConflict", "isVisible", "createdAt", "updatedAt", "createdById"
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM patients WHERE phone = '+43 1 234 5678' LIMIT 1),
    (SELECT id FROM users WHERE username = 'maria.therapist' LIMIT 1),
    (SELECT id FROM services WHERE name = 'Klassische Massage' LIMIT 1),
    (SELECT id FROM rooms WHERE name = 'Raum 1' LIMIT 1),
    '2025-08-25'::timestamp,
    '14:00',
    '15:00',
    'SCHEDULED',
    'Erste Behandlung für Rückenschmerzen',
    false,
    true,
    NOW(),
    NOW(),
    (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1)
);
```

**Find Today's Appointments:**
```sql
SELECT 
    a.id, a."scheduledDate", a."startTime", a."endTime", a.status,
    p."firstName" || ' ' || p."lastName" as patient_name,
    u."firstName" || ' ' || u."lastName" as staff_name,
    s.name as service_name,
    r.name as room_name
FROM appointments a
JOIN patients p ON a."patientId" = p.id
JOIN users u ON a."staffId" = u.id
JOIN services s ON a."serviceId" = s.id
JOIN rooms r ON a."roomId" = r.id
WHERE a."scheduledDate"::date = CURRENT_DATE
AND a.status NOT IN ('CANCELLED', 'NO_SHOW')
ORDER BY a."startTime";
```

**Check for Scheduling Conflicts:**
```sql
SELECT 
    a.id, a."startTime", a."endTime",
    p."firstName" || ' ' || p."lastName" as patient_name,
    u."firstName" || ' ' || u."lastName" as staff_name
FROM appointments a
JOIN patients p ON a."patientId" = p.id
JOIN users u ON a."staffId" = u.id
WHERE a."scheduledDate" = '2025-08-25'::timestamp
AND a."staffId" = 'staff-uuid-here'
AND a.status NOT IN ('CANCELLED', 'NO_SHOW')
AND (
    ('14:00' >= a."startTime" AND '14:00' < a."endTime") OR
    ('15:00' > a."startTime" AND '15:00' <= a."endTime") OR
    (a."startTime" >= '14:00' AND a."endTime" <= '15:00')
);
```

**Update Appointment Status:**
```sql
UPDATE appointments 
SET status = 'COMPLETED', 
    "updatedAt" = NOW(),
    "modifiedById" = (SELECT id FROM users WHERE username = 'current-user' LIMIT 1)
WHERE id = 'appointment-uuid-here';
```

---

## 4. SERVICES
**Purpose**: Treatment services and offerings  
**Key Features**: Pricing in EUR, duration tracking, categorization

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | text | NO | - | Primary key (UUID) |
| `name` | text | NO | - | Service name (German) |
| `description` | text | YES | - | Service description |
| `duration` | integer | NO | - | Duration in minutes |
| `price` | numeric(10,2) | NO | - | Price in EUR |
| `category` | ServiceCategory | NO | - | Service category |
| `categoryColor` | text | NO | '#3B82F6' | Color for calendar display |
| `sessionCount` | integer | NO | 1 | Number of sessions |
| `isForChildren` | boolean | NO | false | Child/student service |
| `isVoucher` | boolean | NO | false | Package voucher |
| `isActive` | boolean | NO | true | Service availability |
| `createdAt` | timestamp | NO | CURRENT_TIMESTAMP | Creation time |
| `updatedAt` | timestamp | NO | - | Last update time |
| `createdById` | text | NO | - | FK→users.id |
| `modifiedById` | text | YES | - | FK→users.id |

**Unique Constraints**: name

### SQL Examples for SERVICES:

**Create New Service:**
```sql
INSERT INTO services (
    id, name, description, duration, price, category,
    "categoryColor", "sessionCount", "isForChildren", "isVoucher",
    "isActive", "createdAt", "updatedAt", "createdById"
) VALUES (
    gen_random_uuid(),
    'Klassische Massage',
    'Entspannende Ganzkörpermassage für Stressabbau und Muskelentspannung',
    60,
    65.00,
    'MASSAGE',
    '#10B981',
    1,
    false,
    false,
    true,
    NOW(),
    NOW(),
    (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1)
);
```

**Get All Active Services by Category:**
```sql
SELECT 
    id, name, description, duration, price, category, "categoryColor"
FROM services 
WHERE "isActive" = true 
AND category = 'PHYSIOTHERAPY'
ORDER BY price ASC;
```

**Find Services by Price Range:**
```sql
SELECT 
    id, name, duration, price, category
FROM services 
WHERE "isActive" = true 
AND price BETWEEN 50.00 AND 80.00
ORDER BY category, price;
```

**Get Service Usage Statistics:**
```sql
SELECT 
    s.name, s.price, s.category,
    COUNT(a.id) as appointment_count,
    SUM(s.price) as total_revenue
FROM services s
LEFT JOIN appointments a ON s.id = a."serviceId" 
    AND a.status = 'COMPLETED'
    AND a."scheduledDate" >= '2025-01-01'::timestamp
WHERE s."isActive" = true
GROUP BY s.id, s.name, s.price, s.category
ORDER BY appointment_count DESC;
```

---

## 5. ROOMS
**Purpose**: Treatment rooms and facilities  
**Key Features**: Feature tracking, capacity management

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | text | NO | - | Primary key (UUID) |
| `name` | text | NO | - | Room name |
| `description` | text | YES | - | Room description |
| `features` | text[] | YES | - | Room features array |
| `capacity` | integer | NO | 1 | Maximum occupancy |
| `isActive` | boolean | NO | true | Room availability |
| `createdAt` | timestamp | NO | CURRENT_TIMESTAMP | Creation time |
| `updatedAt` | timestamp | NO | - | Last update time |
| `createdById` | text | NO | - | FK→users.id |
| `modifiedById` | text | YES | - | FK→users.id |

**Unique Constraints**: name

### SQL Examples for ROOMS:

**Create New Room:**
```sql
INSERT INTO rooms (
    id, name, description, features, capacity,
    "isActive", "createdAt", "updatedAt", "createdById"
) VALUES (
    gen_random_uuid(),
    'Massage Raum 1',
    'Ruhiger Raum für Massagen mit entspannender Atmosphäre',
    ARRAY['Massage Table', 'Sound System', 'Dimmed Lighting', 'Air Conditioning'],
    1,
    true,
    NOW(),
    NOW(),
    (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1)
);
```

**Get All Active Rooms:**
```sql
SELECT 
    id, name, description, features, capacity
FROM rooms 
WHERE "isActive" = true 
ORDER BY name;
```

**Find Rooms by Feature:**
```sql
SELECT 
    id, name, description, features
FROM rooms 
WHERE "isActive" = true 
AND 'Sound System' = ANY(features)
ORDER BY name;
```

**Check Room Availability:**
```sql
SELECT 
    r.id, r.name
FROM rooms r
WHERE r."isActive" = true
AND NOT EXISTS (
    SELECT 1 FROM appointments a 
    WHERE a."roomId" = r.id 
    AND a."scheduledDate" = '2025-08-25'::timestamp
    AND a."startTime" = '14:00'
    AND a.status NOT IN ('CANCELLED', 'NO_SHOW')
)
ORDER BY r.name;
```

---

## 6. PACKAGES
**Purpose**: Service packages and vouchers  
**Key Features**: Discount calculation, session tracking

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | text | NO | - | Primary key (UUID) |
| `patientId` | text | NO | - | FK→patients.id |
| `name` | text | NO | - | Package name |
| `totalPrice` | numeric(10,2) | NO | - | Original total price |
| `discountAmount` | numeric(10,2) | YES | - | Discount applied |
| `finalPrice` | numeric(10,2) | NO | - | Final price after discount |
| `status` | PackageStatus | NO | 'ACTIVE' | Package status |
| `paymentStatus` | PaymentStatus | NO | 'NONE' | Payment status |
| `createdAt` | timestamp | NO | CURRENT_TIMESTAMP | Creation time |
| `updatedAt` | timestamp | NO | - | Last update time |
| `createdById` | text | NO | - | FK→users.id |

### SQL Examples for PACKAGES:

**Create New Package:**
```sql
INSERT INTO packages (
    id, "patientId", name, "totalPrice", "discountAmount", "finalPrice",
    status, "paymentStatus", "createdAt", "updatedAt", "createdById"
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM patients WHERE phone = '+43 1 234 5678' LIMIT 1),
    '10+1 Massage Paket',
    715.00,  -- 11 x 65€
    65.00,   -- 1 session free
    650.00,  -- Final price
    'ACTIVE',
    'COMPLETED',
    NOW(),
    NOW(),
    (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1)
);
```

**Get Active Packages for Patient:**
```sql
SELECT 
    pkg.id, pkg.name, pkg."finalPrice", pkg.status, pkg."paymentStatus",
    p."firstName" || ' ' || p."lastName" as patient_name
FROM packages pkg
JOIN patients p ON pkg."patientId" = p.id
WHERE p.phone = '+43 1 234 5678'
AND pkg.status = 'ACTIVE'
ORDER BY pkg."createdAt" DESC;
```

**Package Usage Summary:**
```sql
SELECT 
    pkg.id, pkg.name, pkg."finalPrice", pkg.status,
    SUM(pi."sessionCount") as total_sessions,
    SUM(pi."completedCount") as completed_sessions,
    (SUM(pi."sessionCount") - SUM(pi."completedCount")) as remaining_sessions
FROM packages pkg
JOIN package_items pi ON pkg.id = pi."packageId"
WHERE pkg."patientId" = 'patient-uuid-here'
GROUP BY pkg.id, pkg.name, pkg."finalPrice", pkg.status
ORDER BY pkg."createdAt" DESC;
```

---

## 7. PACKAGE_ITEMS
**Purpose**: Individual services within packages  

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | text | NO | - | Primary key (UUID) |
| `packageId` | text | NO | - | FK→packages.id |
| `serviceId` | text | NO | - | FK→services.id |
| `sessionCount` | integer | NO | - | Total sessions |
| `completedCount` | integer | NO | 0 | Completed sessions |

**Unique Constraints**: (packageId, serviceId)

### SQL Examples for PACKAGE_ITEMS:

**Add Service to Package:**
```sql
INSERT INTO package_items (
    id, "packageId", "serviceId", "sessionCount", "completedCount"
) VALUES (
    gen_random_uuid(),
    'package-uuid-here',
    (SELECT id FROM services WHERE name = 'Klassische Massage' LIMIT 1),
    11,  -- 10 + 1 free
    0
);
```

**Get Package Contents:**
```sql
SELECT 
    pi.id, pi."sessionCount", pi."completedCount",
    s.name as service_name, s.price, s.duration,
    (pi."sessionCount" - pi."completedCount") as remaining_sessions
FROM package_items pi
JOIN services s ON pi."serviceId" = s.id
WHERE pi."packageId" = 'package-uuid-here'
ORDER BY s.name;
```

**Update Completed Sessions:**
```sql
UPDATE package_items 
SET "completedCount" = "completedCount" + 1
WHERE "packageId" = 'package-uuid-here' 
AND "serviceId" = 'service-uuid-here'
AND "completedCount" < "sessionCount";
```

---

## 8. PAYMENTS
**Purpose**: Financial transactions and payment records  

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | text | NO | - | Primary key (UUID) |
| `patientId` | text | NO | - | FK→patients.id |
| `packageId` | text | YES | - | FK→packages.id |
| `amount` | numeric(10,2) | NO | - | Payment amount in EUR |
| `paymentMethod` | PaymentMethod | NO | - | Payment method used |
| `paidSessionsCount` | integer | YES | - | Sessions paid for |
| `status` | PaymentStatus | NO | 'PENDING' | Payment status |
| `paidAt` | timestamp | YES | - | Payment date |
| `notes` | text | YES | - | Payment notes |
| `createdAt` | timestamp | NO | CURRENT_TIMESTAMP | Creation time |
| `updatedAt` | timestamp | NO | - | Last update time |
| `createdById` | text | NO | - | FK→users.id |

### SQL Examples for PAYMENTS:

**Record New Payment:**
```sql
INSERT INTO payments (
    id, "patientId", "packageId", amount, "paymentMethod",
    "paidSessionsCount", status, "paidAt", notes,
    "createdAt", "updatedAt", "createdById"
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM patients WHERE phone = '+43 1 234 5678' LIMIT 1),
    'package-uuid-here',
    650.00,
    'CARD',
    11,
    'COMPLETED',
    NOW(),
    'Bezahlung für 10+1 Massage Paket',
    NOW(),
    NOW(),
    (SELECT id FROM users WHERE username = 'receptionist' LIMIT 1)
);
```

**Get Payment History for Patient:**
```sql
SELECT 
    pay.id, pay.amount, pay."paymentMethod", pay.status, pay."paidAt",
    pay.notes, pkg.name as package_name
FROM payments pay
LEFT JOIN packages pkg ON pay."packageId" = pkg.id
WHERE pay."patientId" = 'patient-uuid-here'
ORDER BY pay."paidAt" DESC;
```

**Daily Revenue Report:**
```sql
SELECT 
    DATE(pay."paidAt") as payment_date,
    COUNT(*) as transaction_count,
    SUM(pay.amount) as total_amount,
    string_agg(DISTINCT pay."paymentMethod"::text, ', ') as payment_methods
FROM payments pay
WHERE pay.status = 'COMPLETED'
AND pay."paidAt"::date = CURRENT_DATE
GROUP BY DATE(pay."paidAt");
```

---

## 9. STAFF_SCHEDULES
**Purpose**: Staff working hours and schedules  
**Key Features**: Austrian labor law compliance, break time management

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | text | NO | - | Primary key (UUID) |
| `staffId` | text | NO | - | FK→users.id |
| `dayOfWeek` | integer | NO | - | 0=Sunday, 1=Monday, ..., 6=Saturday |
| `startTime` | text | NO | - | Work start time (HH:MM) |
| `endTime` | text | NO | - | Work end time (HH:MM) |
| `breakStartTime` | text | YES | - | Break start time |
| `breakEndTime` | text | YES | - | Break end time |
| `isActive` | boolean | NO | true | Schedule status |
| `createdAt` | timestamp | NO | CURRENT_TIMESTAMP | Creation time |
| `updatedAt` | timestamp | NO | - | Last update time |

**Unique Constraints**: (staffId, dayOfWeek)

### SQL Examples for STAFF_SCHEDULES:

**Create Staff Schedule:**
```sql
INSERT INTO staff_schedules (
    id, "staffId", "dayOfWeek", "startTime", "endTime",
    "breakStartTime", "breakEndTime", "isActive", "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM users WHERE username = 'maria.therapist' LIMIT 1),
    1,  -- Monday
    '09:00',
    '17:00',
    '12:00',
    '13:00',
    true,
    NOW(),
    NOW()
);
```

**Get Staff Schedule for Week:**
```sql
SELECT 
    ss."dayOfWeek", ss."startTime", ss."endTime", 
    ss."breakStartTime", ss."breakEndTime",
    u."firstName" || ' ' || u."lastName" as staff_name,
    CASE ss."dayOfWeek"
        WHEN 0 THEN 'Sonntag'
        WHEN 1 THEN 'Montag'
        WHEN 2 THEN 'Dienstag'
        WHEN 3 THEN 'Mittwoch'
        WHEN 4 THEN 'Donnerstag'
        WHEN 5 THEN 'Freitag'
        WHEN 6 THEN 'Samstag'
    END as day_name
FROM staff_schedules ss
JOIN users u ON ss."staffId" = u.id
WHERE ss."staffId" = 'staff-uuid-here'
AND ss."isActive" = true
ORDER BY ss."dayOfWeek";
```

**Find Available Staff for Time Slot:**
```sql
SELECT 
    u.id, u."firstName", u."lastName", u.specialization,
    ss."startTime", ss."endTime"
FROM users u
JOIN staff_schedules ss ON u.id = ss."staffId"
WHERE u."isActive" = true 
AND u.role = 'USER'
AND ss."dayOfWeek" = EXTRACT(DOW FROM '2025-08-25'::date)
AND ss."isActive" = true
AND '14:00' >= ss."startTime" 
AND '15:00' <= ss."endTime"
AND NOT EXISTS (
    SELECT 1 FROM appointments a
    WHERE a."staffId" = u.id
    AND a."scheduledDate" = '2025-08-25'::timestamp
    AND a.status NOT IN ('CANCELLED', 'NO_SHOW')
    AND (
        ('14:00' >= a."startTime" AND '14:00' < a."endTime") OR
        ('15:00' > a."startTime" AND '15:00' <= a."endTime")
    )
);
```

---

## 10. STAFF_LEAVES
**Purpose**: Staff vacation and absence management  

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | text | NO | - | Primary key (UUID) |
| `staffId` | text | NO | - | FK→users.id |
| `startDate` | timestamp | NO | - | Leave start date |
| `endDate` | timestamp | NO | - | Leave end date |
| `reason` | text | YES | - | Leave reason |
| `isApproved` | boolean | NO | false | Approval status |
| `createdAt` | timestamp | NO | CURRENT_TIMESTAMP | Creation time |
| `updatedAt` | timestamp | NO | - | Last update time |

### SQL Examples for STAFF_LEAVES:

**Request Staff Leave:**
```sql
INSERT INTO staff_leaves (
    id, "staffId", "startDate", "endDate", reason,
    "isApproved", "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM users WHERE username = 'maria.therapist' LIMIT 1),
    '2025-09-01'::timestamp,
    '2025-09-07'::timestamp,
    'Urlaub - Familienbesuch',
    false,
    NOW(),
    NOW()
);
```

**Get Pending Leave Requests:**
```sql
SELECT 
    sl.id, sl."startDate", sl."endDate", sl.reason,
    u."firstName" || ' ' || u."lastName" as staff_name,
    u.specialization
FROM staff_leaves sl
JOIN users u ON sl."staffId" = u.id
WHERE sl."isApproved" = false
ORDER BY sl."startDate";
```

**Check Staff Availability:**
```sql
SELECT 
    u.id, u."firstName", u."lastName"
FROM users u
WHERE u."isActive" = true 
AND u.role = 'USER'
AND NOT EXISTS (
    SELECT 1 FROM staff_leaves sl
    WHERE sl."staffId" = u.id
    AND sl."isApproved" = true
    AND '2025-08-25'::date BETWEEN sl."startDate"::date AND sl."endDate"::date
);
```

---

## 11. PATIENT_HISTORY
**Purpose**: Medical history and treatment records  

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | text | NO | - | Primary key (UUID) |
| `patientId` | text | NO | - | FK→patients.id |
| `packageId` | text | YES | - | FK→packages.id |
| `appointmentId` | text | YES | - | FK→appointments.id |
| `mainSubjectiveProblem` | text | YES | - | Main patient complaint |
| `symptomHistory` | text | YES | - | History of symptoms |
| `previousCourseAndTherapy` | text | YES | - | Previous treatments |
| `patientGoals` | text | YES | - | Treatment goals |
| `activityStatus` | text | YES | - | Patient activity level |
| `trunkAndHeadParticularities` | text | YES | - | Physical examination |
| `edemaTrophicsAtrophies` | text | YES | - | Edema/trophy conditions |
| `notes` | text | YES | - | Additional notes |
| `recordedAt` | timestamp | NO | CURRENT_TIMESTAMP | Record timestamp |
| `createdAt` | timestamp | NO | CURRENT_TIMESTAMP | Creation time |
| `updatedAt` | timestamp | NO | - | Last update time |
| `createdById` | text | NO | - | FK→users.id |
| `modifiedById` | text | YES | - | FK→users.id |

### SQL Examples for PATIENT_HISTORY:

**Create Medical Record:**
```sql
INSERT INTO patient_history (
    id, "patientId", "appointmentId", "mainSubjectiveProblem", 
    "symptomHistory", "previousCourseAndTherapy", "patientGoals",
    "activityStatus", notes, "recordedAt", "createdAt", 
    "updatedAt", "createdById"
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM patients WHERE phone = '+43 1 234 5678' LIMIT 1),
    'appointment-uuid-here',
    'Chronische Rückenschmerzen im Bereich LWS',
    'Schmerzen bestehen seit 3 Monaten, verstärkt bei langem Sitzen',
    'Physiotherapie vor 6 Monaten, kurzzeitige Besserung',
    'Schmerzreduktion und verbesserte Beweglichkeit',
    'Büroarbeit 8h täglich, wenig Sport',
    'Patient sehr motiviert für Behandlung',
    NOW(),
    NOW(),
    NOW(),
    (SELECT id FROM users WHERE specialization = 'PHYSIOTHERAPY' LIMIT 1)
);
```

**Get Patient Medical History:**
```sql
SELECT 
    ph."recordedAt", ph."mainSubjectiveProblem", ph."symptomHistory",
    ph."patientGoals", ph.notes,
    u."firstName" || ' ' || u."lastName" as therapist_name,
    a."scheduledDate", s.name as service_name
FROM patient_history ph
JOIN users u ON ph."createdById" = u.id
LEFT JOIN appointments a ON ph."appointmentId" = a.id
LEFT JOIN services s ON a."serviceId" = s.id
WHERE ph."patientId" = 'patient-uuid-here'
ORDER BY ph."recordedAt" DESC;
```

**Search Medical Records by Condition:**
```sql
SELECT 
    p."firstName" || ' ' || p."lastName" as patient_name,
    ph."mainSubjectiveProblem", ph."recordedAt",
    u."firstName" || ' ' || u."lastName" as therapist_name
FROM patient_history ph
JOIN patients p ON ph."patientId" = p.id
JOIN users u ON ph."createdById" = u.id
WHERE LOWER(ph."mainSubjectiveProblem") LIKE LOWER('%rücken%')
OR LOWER(ph."symptomHistory") LIKE LOWER('%rücken%')
ORDER BY ph."recordedAt" DESC;
```

---

## 12. GDPR COMPLIANCE TABLES

### CONSENT_RECORDS

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | text | NO | - | Primary key (UUID) |
| `userId` | text | YES | - | FK→users.id |
| `consentType` | ConsentType | NO | - | Type of consent |
| `granted` | boolean | NO | false | Consent status |
| `ipAddress` | text | YES | - | IP address of consent |
| `userAgent` | text | YES | - | Browser/device info |
| `consentString` | text | YES | - | Consent details |
| `expiresAt` | timestamp | YES | - | Consent expiration |
| `withdrawnAt` | timestamp | YES | - | Withdrawal timestamp |
| `createdAt` | timestamp | NO | CURRENT_TIMESTAMP | Creation time |
| `updatedAt` | timestamp | NO | - | Last update time |

### SQL Examples for CONSENT_RECORDS:

**Record User Consent:**
```sql
INSERT INTO consent_records (
    id, "userId", "consentType", granted, "ipAddress", "userAgent",
    "consentString", "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid(),
    'patient-user-uuid-here',
    'NECESSARY',
    true,
    '192.168.1.100',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
    'User agreed to necessary data processing for medical services',
    NOW(),
    NOW()
);
```

**Check Valid Consents:**
```sql
SELECT 
    cr."consentType", cr.granted, cr."createdAt", cr."expiresAt"
FROM consent_records cr
WHERE cr."userId" = 'user-uuid-here'
AND cr.granted = true
AND (cr."expiresAt" IS NULL OR cr."expiresAt" > NOW())
AND cr."withdrawnAt" IS NULL
ORDER BY cr."createdAt" DESC;
```

### DATA_EXPORT_REQUESTS

### SQL Examples for DATA_EXPORT_REQUESTS:

**Create Export Request:**
```sql
INSERT INTO data_export_requests (
    id, "userId", "requestType", status, "requestedData",
    "expiresAt", notes, "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid(),
    'user-uuid-here',
    'EXPORT',
    'PENDING',
    ARRAY['personal_data', 'appointment_history', 'medical_records'],
    NOW() + INTERVAL '30 days',
    'Complete data export as per GDPR Article 20',
    NOW(),
    NOW()
);
```

### GDPR_AUDIT_LOGS

### SQL Examples for GDPR_AUDIT_LOGS:

**Log Data Access:**
```sql
INSERT INTO gdpr_audit_logs (
    id, "userId", action, "dataType", "recordId", "legalBasis",
    purpose, "ipAddress", "userAgent", automated, "createdAt"
) VALUES (
    gen_random_uuid(),
    'staff-uuid-here',
    'DATA_ACCESS',
    'patient_medical_records',
    'patient-uuid-here',
    'Treatment contract - Article 6(1)(b) GDPR',
    'Medical treatment documentation',
    '192.168.1.50',
    'Medical-App/1.0',
    false,
    NOW()
);
```

---

## 13. SYSTEM TABLES

### AUDIT_LOGS

### SQL Examples for AUDIT_LOGS:

**Log User Action:**
```sql
INSERT INTO audit_logs (
    id, "userId", action, "tableName", "recordId", 
    "oldValues", "newValues", description, "ipAddress", 
    "userAgent", "createdAt"
) VALUES (
    gen_random_uuid(),
    'user-uuid-here',
    'UPDATE',
    'appointments',
    'appointment-uuid-here',
    '{"status": "SCHEDULED"}',
    '{"status": "COMPLETED"}',
    'Appointment marked as completed',
    '192.168.1.100',
    'Chrome/91.0',
    NOW()
);
```

### USER_SESSIONS

### SQL Examples for USER_SESSIONS:

**Create User Session:**
```sql
INSERT INTO user_sessions (
    id, "userId", "sessionToken", "ipAddress", "userAgent",
    "isActive", "expiresAt", "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid(),
    'user-uuid-here',
    'unique-session-token-here',
    '192.168.1.100',
    'Chrome/91.0',
    true,
    NOW() + INTERVAL '24 hours',
    NOW(),
    NOW()
);
```

### NOTIFICATIONS

### SQL Examples for NOTIFICATIONS:

**Create Appointment Reminder:**
```sql
INSERT INTO notifications (
    id, "userId", type, title, message, "isRead",
    "scheduledFor", "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid(),
    'user-uuid-here',
    'APPOINTMENT_REMINDER',
    'Termin Erinnerung',
    'Ihr Termin morgen um 14:00 Uhr mit Maria Müller (Klassische Massage)',
    false,
    '2025-08-24 13:00:00'::timestamp,
    NOW(),
    NOW()
);
```

---

## 🔗 KEY RELATIONSHIPS

```
users (staff) → staff_schedules (working hours)
users → appointments (as staff/creator)
patients → appointments (bookings)
patients → packages (service bundles)
packages → package_items → services
appointments → services (treatment type)
appointments → rooms (location)
patients → patient_history (medical records)
users → audit_logs (action tracking)
users → gdpr_audit_logs (GDPR compliance)
```

---

## 🤖 AI AGENT INTEGRATION NOTES

### Data Types for AI Processing
- **IDs**: All primary keys are `text` type (UUIDs as strings)
- **Timestamps**: `timestamp(3) without time zone` - use ISO format
- **Money**: `numeric(10,2)` - always EUR currency
- **Arrays**: `text[]` - JSON arrays for features, codes
- **JSONB**: Used for audit trail old/new values

### Austrian Healthcare Context
- **Language**: Primary language is German
- **Currency**: All prices in EUR (Euro)
- **Insurance**: Austrian public/private insurance system
- **Labor Laws**: Break times mandatory for 6+ hour shifts
- **Medical Records**: 10-year retention requirement
- **GDPR**: Full compliance with EU data protection

### Security Considerations
- Never expose `password`, `mfaSecret` fields
- Audit all AI data access through `audit_logs`
- Respect GDPR consent in `consent_records`
- Use role-based filtering (`role` column in users)

### Performance Guidelines
- Use indexed lookups: `id`, `email`, `phone`, `username`
- Filter by date ranges for large datasets
- Use `isActive = true` to exclude soft-deleted records
- Leverage enum values for precise filtering

This schema supports a complete Austrian medical center with GDPR compliance, comprehensive audit trails, and specialized healthcare workflows.