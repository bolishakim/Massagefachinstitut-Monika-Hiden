// Global TypeScript type definitions for Medical Center

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  avatar?: string;
  phone?: string;
  timezone?: string;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  specialization?: StaffSpecialization;
}

export enum Role {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  USER = 'USER',
}

export enum StaffSpecialization {
  MASSAGE = 'MASSAGE',
  PHYSIOTHERAPY = 'PHYSIOTHERAPY',
  INFRARED_CHAIR = 'INFRARED_CHAIR',
  TRAINING = 'TRAINING',
  HEILMASSAGE = 'HEILMASSAGE', // Austrian certified healing massage
  MEDICAL_MASSAGE = 'MEDICAL_MASSAGE', // Medical massage
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface ProfileForm {
  firstName: string;
  lastName: string;
  phone?: string;
  timezone?: string;
}

export interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordForm {
  email: string;
}

export interface ResetPasswordForm {
  token: string;
  password: string;
  confirmPassword: string;
}

// AI Assistant types
export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  checksum?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number;
  pageCount?: number;
}

export interface MessageFile {
  data: File;
  metadata: FileMetadata;
  preview?: string;
}

export type MessageType = 'text' | 'voice' | 'file' | 'system';

export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  files?: MessageFile[];
  sender: 'user' | 'assistant';
  timestamp: string;
  status: 'sending' | 'sent' | 'error';
  sessionId?: string;
}

export interface UserContext {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  sessionId: string;
  timestamp: string;
}

export interface AssistantWebhookPayload {
  message: string;
  messageType: MessageType;
  files?: {
    data: string; // base64 encoded
    metadata: FileMetadata;
  }[];
  userContext: UserContext;
}

export interface AssistantResponse {
  success: boolean;
  data?: {
    message: string;
    messageId?: string;
    suggestions?: string[];
  };
  error?: string;
}

export interface VoiceRecordingState {
  isRecording: boolean;
  duration: number;
  audioBlob?: Blob;
  audioURL?: string;
  error?: string;
}

export interface AssistantSettings {
  webhookUrl: string;
  maxFileSize: number;
  supportedFileTypes: string[];
  voiceEnabled: boolean;
  fileUploadEnabled: boolean;
}

// Medical Center Specific Types

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  email?: string;
  phone: string;
  address?: string;
  socialInsuranceNumber?: string; // Austrian SVN
  notes?: string;
  doctorReferral?: string; // Doctor who referred patient
  insuranceType?: InsuranceType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum InsuranceType {
  PUBLIC_INSURANCE = 'PUBLIC_INSURANCE', // Gesetzliche Krankenversicherung
  PRIVATE_INSURANCE = 'PRIVATE_INSURANCE', // Private Krankenversicherung
  SELF_PAY = 'SELF_PAY', // Selbstzahler
}

export interface PatientHistory {
  id: string;
  patientId: string;
  packageId?: string;
  appointmentId?: string;
  // Medical Assessment Fields
  generalImpression?: string;
  medicalHistory?: string;
  mainSubjectiveProblem?: string;
  symptomHistory?: string;
  previousCourseAndTherapy?: string;
  patientGoals?: string;
  activityStatus?: string;
  trunkAndHeadParticularities?: string;
  edemaTrophicsAtrophies?: string;
  notes?: string;
  recordedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  name: string;
  nameGerman?: string; // German name for Austrian market
  description?: string;
  duration: number; // Duration in minutes
  price: number; // Price in euros
  category: ServiceCategory;
  categoryColor: string; // Hex color for calendar display
  isForChildren: boolean; // For children/student pricing
  isVoucher: boolean; // If this is a voucher/package service
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum ServiceCategory {
  MASSAGE = 'MASSAGE',
  PHYSIOTHERAPY = 'PHYSIOTHERAPY',
  INFRARED_CHAIR = 'INFRARED_CHAIR',
  TRAINING = 'TRAINING',
  HEILMASSAGE = 'HEILMASSAGE', // Austrian certified healing massage
  COMBINATION = 'COMBINATION', // Combination services like SEN-RELAX + Massage
  VOUCHER = 'VOUCHER', // Package vouchers like 10+1 free
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  features: string[]; // Array of features like ["Massage Table", "Sound System", "AC"]
  isActive: boolean;
  capacity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Package {
  id: string;
  patientId: string;
  name: string; // Custom package name
  totalPrice: number;
  discountAmount?: number;
  finalPrice: number;
  status: PackageStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  packageItems: PackageItem[];
}

export enum PackageStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface PackageItem {
  id: string;
  packageId: string;
  serviceId: string;
  sessionCount: number; // Number of sessions for this service
  completedCount: number; // How many sessions completed
  service?: Service; // Populated service details
}

export interface Appointment {
  id: string;
  patientId: string;
  packageId?: string;
  serviceId: string;
  staffId: string;
  roomId: string;
  scheduledDate: string;
  startTime: string; // Format: "14:00"
  endTime: string; // Format: "14:45"
  status: AppointmentStatus;
  notes?: string;
  hasConflict: boolean;
  conflictReason?: string;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
  // Populated relations
  patient?: Patient;
  package?: Package;
  service?: Service;
  staff?: User;
  room?: Room;
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export interface Payment {
  id: string;
  patientId: string;
  packageId?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paidSessionsCount?: number; // How many sessions this payment covers
  status: PaymentStatus;
  paidAt?: string;
  notes?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  REFUNDED = 'REFUNDED',
}

export interface StaffSchedule {
  id: string;
  staffId: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday, etc.
  startTime: string; // Format: "09:00"
  endTime: string; // Format: "17:00"
  breakStartTime?: string; // Format: "13:00"
  breakEndTime?: string; // Format: "15:00"
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StaffLeave {
  id: string;
  staffId: string;
  startDate: string;
  endDate: string;
  reason?: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

// Form types for Medical Center
export interface PatientForm {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  email?: string;
  phone: string;
  address?: string;
  socialInsuranceNumber?: string;
  notes?: string;
  doctorReferral?: string;
  insuranceType?: InsuranceType;
}

export interface AppointmentForm {
  patientId: string;
  packageId?: string;
  serviceId: string;
  staffId: string;
  roomId: string;
  scheduledDate: string;
  startTime: string;
  notes?: string;
}

export interface PackageForm {
  patientId: string;
  name: string;
  discountAmount?: number;
  packageItems: {
    serviceId: string;
    sessionCount: number;
  }[];
}

export interface ServiceForm {
  name: string;
  nameGerman?: string;
  description?: string;
  duration: number;
  price: number;
  category: ServiceCategory;
  categoryColor: string;
  isForChildren: boolean;
  isVoucher: boolean;
}