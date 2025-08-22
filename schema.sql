--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (Debian 16.9-1.pgdg120+1)
-- Dumped by pg_dump version 16.9 (Debian 16.9-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AppointmentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AppointmentStatus" AS ENUM (
    'SCHEDULED',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW'
);


ALTER TYPE public."AppointmentStatus" OWNER TO postgres;

--
-- Name: AuditAction; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AuditAction" AS ENUM (
    'CREATE',
    'UPDATE',
    'DELETE',
    'LOGIN',
    'LOGOUT',
    'LOGIN_FAILED',
    'TOKEN_REFRESH',
    'TOKEN_REFRESH_FAILED',
    'VIEW_LIST',
    'VIEW_DETAILED',
    'EXPORT',
    'UNKNOWN'
);


ALTER TYPE public."AuditAction" OWNER TO postgres;

--
-- Name: ConsentType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ConsentType" AS ENUM (
    'NECESSARY',
    'SYSTEM_OPTIMIZATION',
    'NOTIFICATIONS',
    'AUDIT_MONITORING'
);


ALTER TYPE public."ConsentType" OWNER TO postgres;

--
-- Name: DataRequestStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DataRequestStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'EXPIRED'
);


ALTER TYPE public."DataRequestStatus" OWNER TO postgres;

--
-- Name: DataRequestType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DataRequestType" AS ENUM (
    'EXPORT',
    'DELETE',
    'RESTRICT'
);


ALTER TYPE public."DataRequestType" OWNER TO postgres;

--
-- Name: GDPRAction; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."GDPRAction" AS ENUM (
    'DATA_ACCESS',
    'DATA_EXPORT',
    'DATA_MODIFICATION',
    'DATA_DELETION',
    'CONSENT_GIVEN',
    'CONSENT_WITHDRAWN',
    'PROCESSING_RESTRICTED'
);


ALTER TYPE public."GDPRAction" OWNER TO postgres;

--
-- Name: InsuranceType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."InsuranceType" AS ENUM (
    'PUBLIC_INSURANCE',
    'PRIVATE_INSURANCE',
    'SELF_PAY'
);


ALTER TYPE public."InsuranceType" OWNER TO postgres;

--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NotificationType" AS ENUM (
    'APPOINTMENT_REMINDER',
    'PAYMENT_DUE',
    'STAFF_LEAVE_REQUEST',
    'PACKAGE_EXPIRING',
    'SYSTEM_ALERT',
    'APPOINTMENT_CONFLICT'
);


ALTER TYPE public."NotificationType" OWNER TO postgres;

--
-- Name: PackageStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PackageStatus" AS ENUM (
    'ACTIVE',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."PackageStatus" OWNER TO postgres;

--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'CASH',
    'CARD',
    'BANK_TRANSFER'
);


ALTER TYPE public."PaymentMethod" OWNER TO postgres;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'COMPLETED',
    'REFUNDED',
    'NONE',
    'PARTIALLY_PAID'
);


ALTER TYPE public."PaymentStatus" OWNER TO postgres;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'MODERATOR',
    'USER'
);


ALTER TYPE public."Role" OWNER TO postgres;

--
-- Name: ServiceCategory; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ServiceCategory" AS ENUM (
    'MASSAGE',
    'PHYSIOTHERAPY',
    'INFRARED_CHAIR',
    'TRAINING',
    'HEILMASSAGE',
    'COMBINATION',
    'VOUCHER'
);


ALTER TYPE public."ServiceCategory" OWNER TO postgres;

--
-- Name: StaffSpecialization; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StaffSpecialization" AS ENUM (
    'MASSAGE',
    'PHYSIOTHERAPY',
    'INFRARED_CHAIR',
    'TRAINING',
    'HEILMASSAGE',
    'MEDICAL_MASSAGE'
);


ALTER TYPE public."StaffSpecialization" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: appointments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appointments (
    id text NOT NULL,
    "patientId" text NOT NULL,
    "packageId" text,
    "serviceId" text NOT NULL,
    "staffId" text NOT NULL,
    "roomId" text NOT NULL,
    "scheduledDate" timestamp(3) without time zone NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    status public."AppointmentStatus" DEFAULT 'SCHEDULED'::public."AppointmentStatus" NOT NULL,
    notes text,
    "hasConflict" boolean DEFAULT false NOT NULL,
    "conflictReason" text,
    "isVisible" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text NOT NULL,
    "modifiedById" text
);


ALTER TABLE public.appointments OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    "userId" text NOT NULL,
    action public."AuditAction" NOT NULL,
    "tableName" text NOT NULL,
    "recordId" text NOT NULL,
    "oldValues" jsonb,
    "newValues" jsonb,
    description text,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: calendar_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.calendar_settings (
    id text NOT NULL,
    "userId" text,
    "workingHoursStart" text DEFAULT '08:00'::text NOT NULL,
    "workingHoursEnd" text DEFAULT '20:00'::text NOT NULL,
    "timeSlotInterval" integer DEFAULT 30 NOT NULL,
    "showWeekends" boolean DEFAULT false NOT NULL,
    "defaultView" text DEFAULT 'day'::text NOT NULL,
    "showStaffAvailability" boolean DEFAULT true NOT NULL,
    "showRoomInfo" boolean DEFAULT true NOT NULL,
    "autoRefreshInterval" integer DEFAULT 300 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.calendar_settings OWNER TO postgres;

--
-- Name: consent_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.consent_records (
    id text NOT NULL,
    "userId" text,
    "consentType" public."ConsentType" NOT NULL,
    granted boolean DEFAULT false NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "consentString" text,
    "expiresAt" timestamp(3) without time zone,
    "withdrawnAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.consent_records OWNER TO postgres;

--
-- Name: data_export_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.data_export_requests (
    id text NOT NULL,
    "userId" text NOT NULL,
    "requestType" public."DataRequestType" DEFAULT 'EXPORT'::public."DataRequestType" NOT NULL,
    status public."DataRequestStatus" DEFAULT 'PENDING'::public."DataRequestStatus" NOT NULL,
    "requestedData" text[],
    "filePath" text,
    "downloadedAt" timestamp(3) without time zone,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.data_export_requests OWNER TO postgres;

--
-- Name: data_retention_policies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.data_retention_policies (
    id text NOT NULL,
    "dataType" text NOT NULL,
    "retentionPeriod" integer NOT NULL,
    description text,
    "legalBasis" text NOT NULL,
    "autoDelete" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.data_retention_policies OWNER TO postgres;

--
-- Name: gdpr_audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gdpr_audit_logs (
    id text NOT NULL,
    "userId" text,
    action public."GDPRAction" NOT NULL,
    "dataType" text NOT NULL,
    "recordId" text,
    "legalBasis" text,
    purpose text NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "consentId" text,
    automated boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.gdpr_audit_logs OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    "userId" text,
    type public."NotificationType" NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "scheduledFor" timestamp(3) without time zone,
    "sentAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: package_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.package_items (
    id text NOT NULL,
    "packageId" text NOT NULL,
    "serviceId" text NOT NULL,
    "sessionCount" integer NOT NULL,
    "completedCount" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.package_items OWNER TO postgres;

--
-- Name: packages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.packages (
    id text NOT NULL,
    "patientId" text NOT NULL,
    name text NOT NULL,
    "totalPrice" numeric(10,2) NOT NULL,
    "discountAmount" numeric(10,2),
    "finalPrice" numeric(10,2) NOT NULL,
    status public."PackageStatus" DEFAULT 'ACTIVE'::public."PackageStatus" NOT NULL,
    "createdById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "paymentStatus" public."PaymentStatus" DEFAULT 'NONE'::public."PaymentStatus" NOT NULL
);


ALTER TABLE public.packages OWNER TO postgres;

--
-- Name: patient_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.patient_history (
    id text NOT NULL,
    "patientId" text NOT NULL,
    "packageId" text,
    "appointmentId" text,
    "mainSubjectiveProblem" text,
    "symptomHistory" text,
    "previousCourseAndTherapy" text,
    "patientGoals" text,
    "activityStatus" text,
    "trunkAndHeadParticularities" text,
    "edemaTrophicsAtrophies" text,
    notes text,
    "recordedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text NOT NULL,
    "modifiedById" text
);


ALTER TABLE public.patient_history OWNER TO postgres;

--
-- Name: patients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.patients (
    id text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    "dateOfBirth" timestamp(3) without time zone,
    email text,
    phone text NOT NULL,
    address text,
    "socialInsuranceNumber" text,
    notes text,
    "doctorReferral" text,
    "insuranceType" public."InsuranceType",
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text NOT NULL,
    "modifiedById" text
);


ALTER TABLE public.patients OWNER TO postgres;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id text NOT NULL,
    "patientId" text NOT NULL,
    "packageId" text,
    amount numeric(10,2) NOT NULL,
    "paymentMethod" public."PaymentMethod" NOT NULL,
    "paidSessionsCount" integer,
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "paidAt" timestamp(3) without time zone,
    notes text,
    "createdById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: rooms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rooms (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    features text[],
    "isActive" boolean DEFAULT true NOT NULL,
    capacity integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text NOT NULL,
    "modifiedById" text
);


ALTER TABLE public.rooms OWNER TO postgres;

--
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    duration integer NOT NULL,
    price numeric(10,2) NOT NULL,
    category public."ServiceCategory" NOT NULL,
    "categoryColor" text DEFAULT '#3B82F6'::text NOT NULL,
    "isForChildren" boolean DEFAULT false NOT NULL,
    "isVoucher" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text NOT NULL,
    "modifiedById" text,
    "sessionCount" integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.services OWNER TO postgres;

--
-- Name: staff_leaves; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff_leaves (
    id text NOT NULL,
    "staffId" text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    reason text,
    "isApproved" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.staff_leaves OWNER TO postgres;

--
-- Name: staff_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff_schedules (
    id text NOT NULL,
    "staffId" text NOT NULL,
    "dayOfWeek" integer NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    "breakStartTime" text,
    "breakEndTime" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.staff_schedules OWNER TO postgres;

--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    id text NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    description text,
    "isPublic" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    id text NOT NULL,
    "userId" text NOT NULL,
    "sessionToken" text NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text,
    password text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    role public."Role" DEFAULT 'USER'::public."Role" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    avatar text,
    phone text,
    timezone text,
    "resetPasswordToken" text,
    "resetPasswordExpires" timestamp(3) without time zone,
    "emailVerified" boolean DEFAULT false NOT NULL,
    "emailVerificationToken" text,
    "refreshToken" text,
    "lastLoginAt" timestamp(3) without time zone,
    specialization public."StaffSpecialization",
    "mfaBackupCodes" text[],
    "mfaEnabled" boolean DEFAULT false NOT NULL,
    "mfaLastUsed" timestamp(3) without time zone,
    "mfaSecret" text,
    username text
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: calendar_settings calendar_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_settings
    ADD CONSTRAINT calendar_settings_pkey PRIMARY KEY (id);


--
-- Name: consent_records consent_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consent_records
    ADD CONSTRAINT consent_records_pkey PRIMARY KEY (id);


--
-- Name: data_export_requests data_export_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.data_export_requests
    ADD CONSTRAINT data_export_requests_pkey PRIMARY KEY (id);


--
-- Name: data_retention_policies data_retention_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.data_retention_policies
    ADD CONSTRAINT data_retention_policies_pkey PRIMARY KEY (id);


--
-- Name: gdpr_audit_logs gdpr_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gdpr_audit_logs
    ADD CONSTRAINT gdpr_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: package_items package_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_items
    ADD CONSTRAINT package_items_pkey PRIMARY KEY (id);


--
-- Name: packages packages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packages
    ADD CONSTRAINT packages_pkey PRIMARY KEY (id);


--
-- Name: patient_history patient_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_history
    ADD CONSTRAINT patient_history_pkey PRIMARY KEY (id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: staff_leaves staff_leaves_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_leaves
    ADD CONSTRAINT staff_leaves_pkey PRIMARY KEY (id);


--
-- Name: staff_schedules staff_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_schedules
    ADD CONSTRAINT staff_schedules_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: calendar_settings_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "calendar_settings_userId_key" ON public.calendar_settings USING btree ("userId");


--
-- Name: data_retention_policies_dataType_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "data_retention_policies_dataType_key" ON public.data_retention_policies USING btree ("dataType");


--
-- Name: package_items_packageId_serviceId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "package_items_packageId_serviceId_key" ON public.package_items USING btree ("packageId", "serviceId");


--
-- Name: patients_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX patients_email_key ON public.patients USING btree (email);


--
-- Name: patients_phone_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX patients_phone_key ON public.patients USING btree (phone);


--
-- Name: patients_socialInsuranceNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "patients_socialInsuranceNumber_key" ON public.patients USING btree ("socialInsuranceNumber");


--
-- Name: rooms_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX rooms_name_key ON public.rooms USING btree (name);


--
-- Name: services_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX services_name_key ON public.services USING btree (name);


--
-- Name: staff_schedules_staffId_dayOfWeek_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "staff_schedules_staffId_dayOfWeek_key" ON public.staff_schedules USING btree ("staffId", "dayOfWeek");


--
-- Name: system_settings_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX system_settings_key_key ON public.system_settings USING btree (key);


--
-- Name: user_sessions_sessionToken_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "user_sessions_sessionToken_key" ON public.user_sessions USING btree ("sessionToken");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: appointments appointments_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "appointments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: appointments appointments_modifiedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "appointments_modifiedById_fkey" FOREIGN KEY ("modifiedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: appointments appointments_packageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "appointments_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES public.packages(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: appointments appointments_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: appointments appointments_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "appointments_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public.rooms(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: appointments appointments_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "appointments_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public.services(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: appointments appointments_staffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "appointments_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: audit_logs audit_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: consent_records consent_records_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consent_records
    ADD CONSTRAINT "consent_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: data_export_requests data_export_requests_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.data_export_requests
    ADD CONSTRAINT "data_export_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: gdpr_audit_logs gdpr_audit_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gdpr_audit_logs
    ADD CONSTRAINT "gdpr_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notifications notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: package_items package_items_packageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_items
    ADD CONSTRAINT "package_items_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES public.packages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: package_items package_items_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_items
    ADD CONSTRAINT "package_items_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public.services(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: packages packages_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packages
    ADD CONSTRAINT "packages_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: packages packages_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packages
    ADD CONSTRAINT "packages_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: patient_history patient_history_appointmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_history
    ADD CONSTRAINT "patient_history_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES public.appointments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: patient_history patient_history_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_history
    ADD CONSTRAINT "patient_history_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: patient_history patient_history_modifiedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_history
    ADD CONSTRAINT "patient_history_modifiedById_fkey" FOREIGN KEY ("modifiedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: patient_history patient_history_packageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_history
    ADD CONSTRAINT "patient_history_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES public.packages(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: patient_history patient_history_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_history
    ADD CONSTRAINT "patient_history_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: patients patients_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT "patients_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: patients patients_modifiedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT "patients_modifiedById_fkey" FOREIGN KEY ("modifiedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payments payments_packageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES public.packages(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: rooms rooms_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT "rooms_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: rooms rooms_modifiedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT "rooms_modifiedById_fkey" FOREIGN KEY ("modifiedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: services services_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT "services_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: services services_modifiedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT "services_modifiedById_fkey" FOREIGN KEY ("modifiedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: staff_leaves staff_leaves_staffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_leaves
    ADD CONSTRAINT "staff_leaves_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: staff_schedules staff_schedules_staffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_schedules
    ADD CONSTRAINT "staff_schedules_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

