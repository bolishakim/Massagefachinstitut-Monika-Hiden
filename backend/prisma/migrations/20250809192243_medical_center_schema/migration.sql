-- CreateEnum
CREATE TYPE "public"."StaffSpecialization" AS ENUM ('MASSAGE', 'PHYSIOTHERAPY', 'INFRARED_CHAIR', 'TRAINING', 'HEILMASSAGE', 'MEDICAL_MASSAGE');

-- CreateEnum
CREATE TYPE "public"."ServiceCategory" AS ENUM ('MASSAGE', 'PHYSIOTHERAPY', 'INFRARED_CHAIR', 'TRAINING', 'HEILMASSAGE', 'COMBINATION', 'VOUCHER');

-- CreateEnum
CREATE TYPE "public"."InsuranceType" AS ENUM ('PUBLIC_INSURANCE', 'PRIVATE_INSURANCE', 'SELF_PAY');

-- CreateEnum
CREATE TYPE "public"."PackageStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."AppointmentStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('CASH', 'CARD', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('APPOINTMENT_REMINDER', 'PAYMENT_DUE', 'STAFF_LEAVE_REQUEST', 'PACKAGE_EXPIRING', 'SYSTEM_ALERT', 'APPOINTMENT_CONFLICT');

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "specialization" "public"."StaffSpecialization";

-- CreateTable
CREATE TABLE "public"."staff_schedules" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "breakStartTime" TEXT,
    "breakEndTime" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."staff_leaves" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_leaves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rooms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "features" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameGerman" TEXT,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "category" "public"."ServiceCategory" NOT NULL,
    "categoryColor" TEXT NOT NULL DEFAULT '#3B82F6',
    "isForChildren" BOOLEAN NOT NULL DEFAULT false,
    "isVoucher" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patients" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "socialInsuranceNumber" TEXT,
    "notes" TEXT,
    "doctorReferral" TEXT,
    "insuranceType" "public"."InsuranceType",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patient_history" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "packageId" TEXT,
    "appointmentId" TEXT,
    "generalImpression" TEXT,
    "medicalHistory" TEXT,
    "mainSubjectiveProblem" TEXT,
    "symptomHistory" TEXT,
    "previousCourseAndTherapy" TEXT,
    "patientGoals" TEXT,
    "activityStatus" TEXT,
    "trunkAndHeadParticularities" TEXT,
    "edemaTrophicsAtrophies" TEXT,
    "notes" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."packages" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "discountAmount" DECIMAL(10,2),
    "finalPrice" DECIMAL(10,2) NOT NULL,
    "status" "public"."PackageStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."package_items" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "sessionCount" INTEGER NOT NULL,
    "completedCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "package_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."appointments" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "packageId" TEXT,
    "serviceId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "status" "public"."AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "hasConflict" BOOLEAN NOT NULL DEFAULT false,
    "conflictReason" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "packageId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMethod" "public"."PaymentMethod" NOT NULL,
    "paidSessionsCount" INTEGER,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "public"."AuditAction" NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "description" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."calendar_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "workingHoursStart" TEXT NOT NULL DEFAULT '08:00',
    "workingHoursEnd" TEXT NOT NULL DEFAULT '20:00',
    "timeSlotInterval" INTEGER NOT NULL DEFAULT 30,
    "showWeekends" BOOLEAN NOT NULL DEFAULT false,
    "defaultView" TEXT NOT NULL DEFAULT 'day',
    "showStaffAvailability" BOOLEAN NOT NULL DEFAULT true,
    "showRoomInfo" BOOLEAN NOT NULL DEFAULT true,
    "autoRefreshInterval" INTEGER NOT NULL DEFAULT 300,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_schedules_staffId_dayOfWeek_key" ON "public"."staff_schedules"("staffId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_name_key" ON "public"."rooms"("name");

-- CreateIndex
CREATE UNIQUE INDEX "services_name_key" ON "public"."services"("name");

-- CreateIndex
CREATE UNIQUE INDEX "package_items_packageId_serviceId_key" ON "public"."package_items"("packageId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_sessionToken_key" ON "public"."user_sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "public"."system_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_settings_userId_key" ON "public"."calendar_settings"("userId");

-- AddForeignKey
ALTER TABLE "public"."staff_schedules" ADD CONSTRAINT "staff_schedules_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_leaves" ADD CONSTRAINT "staff_leaves_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_history" ADD CONSTRAINT "patient_history_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_history" ADD CONSTRAINT "patient_history_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "public"."packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_history" ADD CONSTRAINT "patient_history_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "public"."appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."packages" ADD CONSTRAINT "packages_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."packages" ADD CONSTRAINT "packages_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."package_items" ADD CONSTRAINT "package_items_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "public"."packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."package_items" ADD CONSTRAINT "package_items_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "public"."packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "public"."packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
