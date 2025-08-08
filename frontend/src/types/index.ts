// Global TypeScript type definitions

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
}

export enum Role {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  USER = 'USER',
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