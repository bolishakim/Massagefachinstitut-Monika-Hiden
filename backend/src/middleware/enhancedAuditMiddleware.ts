import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/db';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

interface AuditData {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  method: string;
  url: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  statusCode?: number;
  errorMessage?: string;
  queryParams?: any;
  requestBody?: any;
  sensitiveDataAccessed?: string[];
}

// Define sensitive routes that access patient data
const PATIENT_DATA_ROUTES = [
  '/api/patients',
  '/api/patient-history',
  '/api/appointments'
];

// Define protected actions that require detailed logging
const SENSITIVE_ACTIONS = [
  'CREATE',
  'UPDATE', 
  'DELETE',
  'EXPORT',
  'VIEW_SENSITIVE'
];

// Extract resource info from URL
function getResourceInfo(url: string, method: string): { resource: string; resourceId?: string; isPatientData: boolean } {
  const pathParts = url.split('/').filter(part => part && part !== 'api');
  let resource = pathParts[0] || 'unknown';
  let resourceId: string | undefined;
  
  // Check if the first path part is actually a UUID (patient ID access pattern)
  if (pathParts.length > 0) {
    const firstPart = pathParts[0];
    
    // If first part is a UUID, this is likely a patient access
    if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(firstPart)) {
      resource = 'patients'; // Assume patient access
      resourceId = firstPart;
    }
    // Normal pattern: /api/patients/123 or /api/patients/123/history
    else if (pathParts.length > 1) {
      const potentialId = pathParts[1];
      if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(potentialId) || 
          /^[a-f0-9]{32}$/i.test(potentialId) ||
          /^\d+$/.test(potentialId)) {
        resourceId = potentialId;
      }
    }
  }
  
  // Check if this route accesses patient data
  const isPatientData = resource === 'patients' || 
                        resource === 'patient-history' ||
                        PATIENT_DATA_ROUTES.some(route => url.startsWith(route));
  
  return { resource, resourceId, isPatientData };
}

// Determine action type from HTTP method and context
function getActionType(method: string, url: string, statusCode?: number): string {
  if (method === 'POST') return 'CREATE';
  if (method === 'PUT' || method === 'PATCH') return 'UPDATE';
  if (method === 'DELETE') return 'DELETE';
  if (method === 'GET') {
    // Distinguish between list view and detailed view
    if (url.includes('/export')) return 'EXPORT';
    if (url.match(/\/[a-f\d-]{36}$/)) return 'VIEW_DETAILED';
    return 'VIEW_LIST';
  }
  return 'UNKNOWN';
}

// Extract sensitive data types accessed
function getSensitiveDataTypes(resource: string, body: any, query: any): string[] {
  const sensitiveData: string[] = [];
  
  if (resource === 'patients') {
    sensitiveData.push('patient_personal_data');
    if (body?.socialInsuranceNumber || query?.ssn) {
      sensitiveData.push('social_insurance_number');
    }
    if (body?.email || query?.email) {
      sensitiveData.push('email_address');
    }
    if (body?.phone || query?.phone) {
      sensitiveData.push('phone_number');
    }
  }
  
  if (resource === 'patient-history') {
    sensitiveData.push('medical_history', 'health_data');
  }
  
  if (resource === 'appointments') {
    sensitiveData.push('appointment_data', 'treatment_records');
  }
  
  return sensitiveData;
}

// Enhanced audit logging middleware
export const enhancedAuditMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Skip logging for health checks and static assets
  if (req.url.includes('/health') || req.url.includes('/static')) {
    return next();
  }
  
  // Capture original response methods
  const originalSend = res.send;
  const originalJson = res.json;
  
  let responseBody: any;
  
  // Override res.json to capture response
  res.json = function(body: any) {
    responseBody = body;
    return originalJson.call(this, body);
  };
  
  // Override res.send to capture response
  res.send = function(body: any) {
    if (!responseBody) responseBody = body;
    return originalSend.call(this, body);
  };
  
  // Log the request after response is sent
  res.on('finish', async () => {
    try {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const { resource, resourceId, isPatientData } = getResourceInfo(req.url, req.method);
      const actionType = getActionType(req.method, req.url, res.statusCode);
      const sensitiveDataAccessed = getSensitiveDataTypes(resource, req.body, req.query);
      
      // Deep debug logging to understand the counting issue
      if (isPatientData) {
        console.log(`🔍 AUDIT LOG CREATION: ${req.method} ${req.url}`);
        console.log(`   - Resource: ${resource}, ID: ${resourceId}`);
        console.log(`   - Action: ${actionType}, User: ${req.user?.email}`);
        console.log(`   - Timestamp: ${new Date().toISOString()}`);
        console.log(`   - Will create audit log entry in database`);
      }
      
      const auditData: AuditData = {
        userId: req.user?.id,
        action: actionType,
        resource,
        resourceId,
        method: req.method,
        url: req.url,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        statusCode: res.statusCode,
        queryParams: Object.keys(req.query).length > 0 ? req.query : undefined,
        sensitiveDataAccessed: sensitiveDataAccessed.length > 0 ? sensitiveDataAccessed : undefined
      };
      
      // Add request body for write operations (excluding passwords)
      if (['CREATE', 'UPDATE'].includes(actionType) && req.body) {
        const sanitizedBody = { ...req.body };
        delete sanitizedBody.password;
        delete sanitizedBody.confirmPassword;
        auditData.requestBody = sanitizedBody;
      }
      
      // Add error message for failed requests
      if (res.statusCode >= 400) {
        auditData.errorMessage = responseBody?.message || responseBody?.error || 'Unknown error';
      }
      
      // Log to general audit log (only for authenticated users due to foreign key constraint)
      if (req.user?.id) {
        if (isPatientData) {
          console.log(`💾 WRITING AUDIT LOG to database - User: ${req.user.email}, Patient ID: ${resourceId}, Action: ${actionType}`);
        }
        await prisma.auditLog.create({
          data: {
            userId: req.user.id,
            action: actionType as any,
            tableName: resource,
            recordId: resourceId || (actionType === 'VIEW_LIST' ? 'list_view' : 'unknown'),
            newValues: auditData.requestBody,
            description: `${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`,
            ipAddress: auditData.ipAddress,
            userAgent: auditData.userAgent
          }
        });
        if (isPatientData) {
          console.log(`✅ AUDIT LOG WRITTEN to audit_logs table`);
        }
      }
      
      // Enhanced logging for patient data access
      if (isPatientData && req.user) {
        console.log(`💾 WRITING GDPR LOG to database - User: ${req.user.email}, Patient ID: ${resourceId}`);
        await prisma.gDPRAuditLog.create({
          data: {
            userId: req.user.id,
            action: actionType.includes('VIEW') ? 'DATA_ACCESS' : 
                   actionType === 'CREATE' ? 'DATA_MODIFICATION' :
                   actionType === 'UPDATE' ? 'DATA_MODIFICATION' :
                   actionType === 'DELETE' ? 'DATA_DELETION' :
                   actionType === 'EXPORT' ? 'DATA_EXPORT' : 'DATA_ACCESS',
            dataType: sensitiveDataAccessed.join(', ') || resource,
            recordId: resourceId,
            purpose: `Staff member accessed ${resource} for medical center operations`,
            legalBasis: 'Legitimate interest - Healthcare service provision',
            ipAddress: auditData.ipAddress,
            userAgent: auditData.userAgent,
            automated: false
          }
        });
        console.log(`✅ GDPR LOG WRITTEN to gdpr_audit_logs table`);
      }
      
      // Log authentication events
      if (req.url.includes('/auth/')) {
        await logAuthenticationEvent(req, res, auditData);
      }
      
    } catch (error) {
      console.error('Enhanced audit logging error:', error);
      // Don't throw error to avoid disrupting the request flow
    }
  });
  
  next();
};

// Specific authentication event logging
async function logAuthenticationEvent(req: AuthenticatedRequest, res: Response, auditData: AuditData) {
  try {
    let authAction: string;
    let description: string;
    
    if (req.url.includes('/login')) {
      authAction = res.statusCode === 200 ? 'LOGIN' : 'LOGIN_FAILED';
      description = res.statusCode === 200 
        ? `Successful login for ${req.body?.email}` 
        : `Failed login attempt for ${req.body?.email}`;
    } else if (req.url.includes('/logout')) {
      authAction = 'LOGOUT';
      description = `User logged out`;
    } else if (req.url.includes('/refresh')) {
      authAction = res.statusCode === 200 ? 'TOKEN_REFRESH' : 'TOKEN_REFRESH_FAILED';
      description = res.statusCode === 200 ? 'Token refreshed successfully' : 'Token refresh failed';
    } else {
      return; // Skip other auth endpoints
    }
    
    // Log authentication event (only for authenticated users due to foreign key constraint)
    if (req.user?.id) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: authAction as any,
          tableName: 'authentication',
          recordId: req.user.id,
          description,
          ipAddress: auditData.ipAddress,
          userAgent: auditData.userAgent
        }
      });
    }
    
    // GDPR logging for authentication
    if (req.user && res.statusCode === 200) {
      await prisma.gDPRAuditLog.create({
        data: {
          userId: req.user.id,
          action: 'DATA_ACCESS',
          dataType: 'authentication_data',
          purpose: 'User authentication for system access',
          legalBasis: 'Contract - Employment relationship',
          ipAddress: auditData.ipAddress,
          userAgent: auditData.userAgent,
          automated: false
        }
      });
    }
    
  } catch (error) {
    console.error('Authentication audit logging error:', error);
  }
}

// Comprehensive middleware for detailed patient access logging
export const patientAccessLogger = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) return next();
  
  const startTime = Date.now();
  const originalSend = res.send;
  const originalJson = res.json;
  
  let responseData: any;
  let responseSize = 0;
  
  // Capture response data
  res.json = function(body: any) {
    responseData = body;
    responseSize = JSON.stringify(body).length;
    return originalJson.call(this, body);
  };
  
  res.send = function(body: any) {
    if (!responseData) {
      responseData = body;
      responseSize = typeof body === 'string' ? body.length : JSON.stringify(body).length;
    }
    return originalSend.call(this, body);
  };

  // Log after response is sent
  res.on('finish', async () => {
    try {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const { resource, resourceId } = getResourceInfo(req.url, req.method);
      
      // Enhanced logging for all patient and patient history endpoints
      if (shouldLogPatientAccess(req.url, req.method, resource)) {
        await logComprehensivePatientAccess({
          req,
          resource,
          resourceId,
          duration,
          responseSize,
          responseStatus: res.statusCode,
          accessSuccess: res.statusCode >= 200 && res.statusCode < 300,
          responseData: res.statusCode >= 200 && res.statusCode < 300 ? responseData : null
        });
      }
    } catch (error) {
      console.error('Comprehensive patient access logging error:', error);
    }
  });
  
  next();
};

// Determine if request should be logged as patient access
function shouldLogPatientAccess(url: string, method: string, resource: string): boolean {
  // Log all patient-related endpoints
  if (url.includes('/api/patients') || url.includes('/api/patient-history')) {
    return true;
  }
  
  // Log specific patient data resources
  if (resource && ['patients', 'patient-history', 'patient_history'].includes(resource)) {
    return true;
  }
  
  return false;
}

// Comprehensive patient access logging function
async function logComprehensivePatientAccess(params: {
  req: AuthenticatedRequest;
  resource: string;
  resourceId?: string;
  duration: number;
  responseSize: number;
  responseStatus: number;
  accessSuccess: boolean;
  responseData?: any;
}) {
  const { req, resource, resourceId, duration, responseSize, responseStatus, accessSuccess, responseData } = params;
  
  try {
    // Determine access type and data accessed
    const accessDetails = await determineAccessDetails(req.url, req.method, resourceId, responseData);
    
    // Create comprehensive GDPR audit log
    await prisma.gDPRAuditLog.create({
      data: {
        userId: req.user!.id,
        action: getGDPRAction(req.method, accessDetails.accessType),
        dataType: accessDetails.dataType,
        recordId: accessDetails.patientId,
        purpose: accessDetails.purpose,
        legalBasis: 'Legitimate interest - Healthcare service provision under Austrian Medical Practice Act',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        automated: false
      }
    });
    
    // Create detailed audit log entry
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: req.method === 'GET' ? 'VIEW_DETAILED' : req.method as any,
        tableName: accessDetails.tableName,
        recordId: resourceId || 'list_view',
        description: accessDetails.detailedDescription,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        newValues: {
          accessType: accessDetails.accessType,
          dataTypesAccessed: accessDetails.dataTypesAccessed,
          patientInfo: accessDetails.patientInfo,
          duration: `${duration}ms`,
          responseSize: `${responseSize} bytes`,
          responseStatus,
          accessSuccess,
          timestamp: new Date().toISOString(),
          queryParams: req.query,
          userRole: req.user!.role,
          accessReason: accessDetails.accessReason,
          sensitiveDataAccessed: accessDetails.sensitiveDataAccessed
        }
      }
    });

    // Log specific patient access if we have patient information
    if (accessDetails.patientId && accessDetails.patientInfo) {
      console.log(`🔍 PATIENT ACCESS: ${req.user!.email} (${req.user!.role}) accessed ${accessDetails.accessType} for patient ${accessDetails.patientInfo.name} (ID: ${accessDetails.patientId}) - Duration: ${duration}ms`);
    }
    
  } catch (error) {
    console.error('Error in comprehensive patient access logging:', error);
  }
}

// Determine detailed access information
async function determineAccessDetails(url: string, method: string, resourceId?: string, responseData?: any) {
  let accessType = 'unknown';
  let dataType = 'patient_data';
  let tableName = 'patients';
  let patientId = resourceId;
  let patientInfo: any = null;
  let dataTypesAccessed: string[] = [];
  let sensitiveDataAccessed: string[] = [];
  let accessReason = 'Medical center operations';
  
  // Determine access type based on URL pattern
  if (url.includes('/api/patients')) {
    if (resourceId) {
      accessType = 'patient_detail_view';
      dataType = 'patient_personal_data';
      tableName = 'patients';
      dataTypesAccessed = ['personal_information', 'contact_details', 'insurance_info'];
      
      // Get patient information
      try {
        const patient = await prisma.patient.findUnique({
          where: { id: resourceId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            dateOfBirth: true,
            socialInsuranceNumber: true,
            address: true,
            insuranceType: true,
            doctorReferral: true
          }
        });
        
        if (patient) {
          patientInfo = {
            name: `${patient.firstName} ${patient.lastName}`,
            email: patient.email,
            phone: patient.phone,
            hasDateOfBirth: !!patient.dateOfBirth,
            hasInsuranceInfo: !!patient.socialInsuranceNumber,
            hasAddress: !!patient.address
          };
          
          // Check for sensitive data
          if (patient.socialInsuranceNumber) sensitiveDataAccessed.push('social_insurance_number');
          if (patient.dateOfBirth) sensitiveDataAccessed.push('date_of_birth');
          if (patient.email) sensitiveDataAccessed.push('email_address');
          if (patient.phone) sensitiveDataAccessed.push('phone_number');
        }
      } catch (error) {
        console.error('Error fetching patient details for audit:', error);
      }
    } else {
      accessType = 'patient_list_view';
      dataType = 'patient_list_data';
      accessReason = 'Patient management and lookup';
      dataTypesAccessed = ['patient_names', 'basic_info'];
    }
  } else if (url.includes('/api/patient-history')) {
    tableName = 'patient_history';
    dataType = 'medical_history_data';
    dataTypesAccessed = ['medical_history', 'treatment_records', 'anamnesis'];
    sensitiveDataAccessed = ['medical_records', 'health_data'];
    
    if (resourceId) {
      accessType = 'patient_history_detail_view';
      accessReason = 'Medical history review for treatment planning';
      
      // Get patient history details
      try {
        const history = await prisma.patientHistory.findUnique({
          where: { id: resourceId },
          include: {
            patient: {
              select: { id: true, firstName: true, lastName: true }
            }
          }
        });
        
        if (history && history.patient) {
          patientId = history.patient.id;
          patientInfo = {
            name: `${history.patient.firstName} ${history.patient.lastName}`,
            historyRecordId: history.id
          };
        }
      } catch (error) {
        console.error('Error fetching patient history for audit:', error);
      }
    } else {
      accessType = 'patient_history_list_view';
      accessReason = 'Medical history management';
    }
  }
  
  const detailedDescription = `${method} ${url} - ${accessType} - User: ${patientInfo?.name || 'Multiple patients'} - Data types: ${dataTypesAccessed.join(', ')}`;
  
  return {
    accessType,
    dataType,
    tableName,
    patientId,
    patientInfo,
    dataTypesAccessed,
    sensitiveDataAccessed,
    accessReason,
    detailedDescription,
    purpose: `Staff member accessed ${accessType} - ${accessReason}`
  };
}

// Convert HTTP method to GDPR action
function getGDPRAction(method: string, accessType: string): string {
  switch (method) {
    case 'GET':
      return 'DATA_ACCESS';
    case 'POST':
      return 'DATA_MODIFICATION';
    case 'PUT':
    case 'PATCH':
      return 'DATA_MODIFICATION';
    case 'DELETE':
      return 'DATA_DELETION';
    default:
      return 'DATA_ACCESS';
  }
}

export { enhancedAuditMiddleware as default };