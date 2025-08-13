import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuditService } from '../services/auditService';
import { GDPRService } from '../services/gdprService.js';

const prisma = new PrismaClient();

// Validation schemas
const createPatientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().min(1, 'Phone is required'),
  address: z.string().optional(),
  socialInsuranceNumber: z.string().optional(),
  notes: z.string().optional(),
  doctorReferral: z.string().optional(),
  insuranceType: z.enum(['PUBLIC_INSURANCE', 'PRIVATE_INSURANCE', 'SELF_PAY']).optional(),
});

const updatePatientSchema = createPatientSchema.partial();

const querySchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1)).optional().default(1),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1).max(100)).optional().default(10),
  search: z.string().optional(),
  insuranceType: z.enum(['PUBLIC_INSURANCE', 'PRIVATE_INSURANCE', 'SELF_PAY']).optional(),
  isActive: z.enum(['true', 'false', 'all']).optional(),
  sortBy: z.enum(['firstName', 'lastName', 'createdAt', 'dateOfBirth']).optional().default('firstName'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// Get all patients with pagination and filters
export const getPatients = async (req: Request, res: Response) => {
  try {
    const query = querySchema.parse(req.query);
    
    // Build where clause
    const where: any = {};

    // Add isActive filter
    if (query.isActive) {
      if (query.isActive === 'all') {
        // Show both active and inactive patients - don't add isActive filter
      } else {
        where.isActive = query.isActive === 'true';
      }
    } else {
      // Default to showing active patients only when no filter specified
      where.isActive = true;
    }

    // Add search filter
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
        { socialInsuranceNumber: { contains: query.search } },
      ];
    }

    // Add insurance type filter
    if (query.insuranceType) {
      where.insuranceType = query.insuranceType;
    }

    // Calculate pagination
    const skip = (query.page - 1) * query.limit;

    // Get patients with pagination
    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
        skip,
        take: query.limit,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          email: true,
          phone: true,
          address: true,
          socialInsuranceNumber: true,
          notes: true,
          doctorReferral: true,
          insuranceType: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.patient.count({ where }),
    ]);

    // Calculate pagination info
    const pages = Math.ceil(total / query.limit);

    res.json({
      success: true,
      data: patients,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages,
      },
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patients',
    });
  }
};

// Get single patient by ID
export const getPatientById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        packages: {
          include: {
            packageItems: {
              include: {
                service: true,
              },
            },
          },
        },
        appointments: {
          include: {
            service: true,
            staff: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            room: true,
          },
          orderBy: {
            scheduledDate: 'desc',
          },
        },
        patientHistory: {
          orderBy: {
            recordedAt: 'desc',
          },
        },
        payments: {
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found',
      });
    }

    res.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patient',
    });
  }
};

// Create new patient
export const createPatient = async (req: Request, res: Response) => {
  try {
    const data = createPatientSchema.parse(req.body);

    // Validate email format if provided
    if (data.email && data.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email.trim())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email address format',
        });
      }
    }

    // Get user ID from request for audit tracking
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Convert dateOfBirth string to Date if provided
    // Convert empty strings to null to avoid unique constraint issues
    const patientData: any = {
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      email: data.email && data.email.trim() !== '' ? data.email.trim() : null,
      socialInsuranceNumber: data.socialInsuranceNumber && data.socialInsuranceNumber.trim() !== '' 
        ? data.socialInsuranceNumber.trim() 
        : null,
      createdById: userId, // Add audit field
    };

    const patient = await prisma.patient.create({
      data: patientData,
    });

    // Log the creation in audit trail
    await AuditService.logCreate(
      req,
      'Patient',
      patient.id,
      AuditService.cleanSensitiveData(patient),
      `Created patient: ${patient.firstName} ${patient.lastName}`
    );

    res.status(201).json({
      success: true,
      data: patient,
      message: 'Patient created successfully',
    });
  } catch (error: any) {
    console.error('Error creating patient:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    // Handle unique constraint violations
    if (error.code === 'P2002') {
      const target = error.meta?.target;
      let message = 'Ein Patient mit diesen Daten existiert bereits.';
      
      if (Array.isArray(target)) {
        if (target.includes('email')) {
          message = 'Ein Patient mit dieser E-Mail-Adresse existiert bereits.';
        } else if (target.includes('phone')) {
          message = 'Ein Patient mit dieser Telefonnummer existiert bereits.';
        } else if (target.includes('socialInsuranceNumber')) {
          message = 'Ein Patient mit dieser Sozialversicherungsnummer existiert bereits.';
        }
      }
      
      return res.status(409).json({
        success: false,
        error: message,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create patient',
    });
  }
};

// Update patient
export const updatePatient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updatePatientSchema.parse(req.body);

    // Validate email format if provided
    if (data.email && data.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email.trim())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email address format',
        });
      }
    }

    // Get user ID from request for audit tracking
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Check if patient exists
    const existingPatient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!existingPatient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found',
      });
    }

    // Convert dateOfBirth string to Date if provided
    // Convert empty strings to null to avoid unique constraint issues
    const patientData: any = {
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      email: data.email && data.email.trim() !== '' ? data.email.trim() : null,
      socialInsuranceNumber: data.socialInsuranceNumber && data.socialInsuranceNumber.trim() !== '' 
        ? data.socialInsuranceNumber.trim() 
        : null,
      modifiedById: userId, // Add audit field
    };

    const patient = await prisma.patient.update({
      where: { id },
      data: patientData,
    });

    // Log the update in audit trail
    await AuditService.logUpdate(
      req,
      'Patient',
      patient.id,
      AuditService.cleanSensitiveData(existingPatient),
      AuditService.cleanSensitiveData(patient),
      `Updated patient: ${patient.firstName} ${patient.lastName}`
    );

    res.json({
      success: true,
      data: patient,
      message: 'Patient updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating patient:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    // Handle unique constraint violations
    if (error.code === 'P2002') {
      const target = error.meta?.target;
      let message = 'Ein anderer Patient mit diesen Daten existiert bereits.';
      
      if (Array.isArray(target)) {
        if (target.includes('email')) {
          message = 'Ein anderer Patient mit dieser E-Mail-Adresse existiert bereits.';
        } else if (target.includes('phone')) {
          message = 'Ein anderer Patient mit dieser Telefonnummer existiert bereits.';
        } else if (target.includes('socialInsuranceNumber')) {
          message = 'Ein anderer Patient mit dieser Sozialversicherungsnummer existiert bereits.';
        }
      }
      
      return res.status(409).json({
        success: false,
        error: message,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update patient',
    });
  }
};

// Soft delete patient (set isActive to false)
export const deletePatient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get user ID from request for audit tracking
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Check if patient exists
    const existingPatient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!existingPatient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found',
      });
    }

    // Soft delete by setting isActive to false
    await prisma.patient.update({
      where: { id },
      data: { 
        isActive: false,
        modifiedById: userId, // Add audit field
      },
    });

    // Log the deletion in audit trail
    await AuditService.logDelete(
      req,
      'Patient',
      id,
      AuditService.cleanSensitiveData(existingPatient),
      `Soft deleted patient: ${existingPatient.firstName} ${existingPatient.lastName}`
    );

    res.json({
      success: true,
      message: 'Patient deactivated successfully',
    });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete patient',
    });
  }
};

// Bulk delete patients (soft delete)
export const bulkDeletePatients = async (req: Request, res: Response) => {
  try {
    const { patientIds } = req.body;

    // Validate input
    if (!Array.isArray(patientIds) || patientIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Patient IDs array is required and cannot be empty',
      });
    }

    // Get user ID from request for audit tracking
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Check if user has admin role
    const user = (req as any).user;
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Admin role required for bulk operations',
      });
    }

    // Verify all patients exist
    const existingPatients = await prisma.patient.findMany({
      where: { 
        id: { in: patientIds },
        isActive: true 
      },
      select: { id: true, firstName: true, lastName: true }
    });

    if (existingPatients.length !== patientIds.length) {
      const foundIds = existingPatients.map(p => p.id);
      const notFoundIds = patientIds.filter(id => !foundIds.includes(id));
      
      return res.status(404).json({
        success: false,
        error: `Some patients not found: ${notFoundIds.join(', ')}`,
      });
    }

    // Perform bulk soft delete
    const updateResult = await prisma.patient.updateMany({
      where: { 
        id: { in: patientIds },
        isActive: true 
      },
      data: { 
        isActive: false,
        modifiedById: userId,
      },
    });

    // Log each deletion in audit trail
    for (const patient of existingPatients) {
      await AuditService.logDelete(
        req,
        'Patient',
        patient.id,
        AuditService.cleanSensitiveData(patient),
        `Bulk soft deleted patient: ${patient.firstName} ${patient.lastName}`
      );
    }

    res.json({
      success: true,
      message: `Successfully deleted ${updateResult.count} patients`,
      deletedCount: updateResult.count,
    });
  } catch (error) {
    console.error('Error bulk deleting patients:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete patients',
    });
  }
};

// Reactivate patient (set isActive to true)
export const reactivatePatient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get user ID from request for audit tracking
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Check if patient exists
    const existingPatient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!existingPatient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found',
      });
    }

    if (existingPatient.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Patient is already active',
      });
    }

    // Reactivate patient by setting isActive to true
    const reactivatedPatient = await prisma.patient.update({
      where: { id },
      data: { 
        isActive: true,
        modifiedById: userId, // Add audit field
      },
    });

    // Log the reactivation in audit trail
    await AuditService.logUpdate(
      req,
      'Patient',
      id,
      AuditService.cleanSensitiveData(existingPatient),
      AuditService.cleanSensitiveData(reactivatedPatient),
      `Reactivated patient: ${existingPatient.firstName} ${existingPatient.lastName}`
    );

    res.json({
      success: true,
      data: reactivatedPatient,
      message: 'Patient reactivated successfully',
    });
  } catch (error) {
    console.error('Error reactivating patient:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reactivate patient',
    });
  }
};

// Hard delete patient (GDPR Article 17 - Right to Erasure)
export const hardDeletePatient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { confirmDeletion, reason } = req.body;

    // Get user ID from request for audit tracking
    const userId = (req as any).user?.id;
    const user = (req as any).user;
    
    if (!userId || !user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Only admins can perform hard deletions
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Administrative privileges required for permanent patient deletion',
      });
    }

    if (!confirmDeletion) {
      return res.status(400).json({
        success: false,
        error: 'Deletion confirmation required',
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Patient ID is required',
      });
    }

    const result = await GDPRService.hardDeletePatient(req, id, userId);

    if (result.success) {
      return res.json({
        success: true,
        message: 'Patient and all associated medical records have been permanently deleted per GDPR Article 17',
        deletionReason: reason || 'GDPR Right to Erasure request',
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error hard deleting patient:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to permanently delete patient',
    });
  }
};

// Bulk hard delete patients (GDPR Article 17 - Admin only)
export const bulkHardDeletePatients = async (req: Request, res: Response) => {
  try {
    const { patientIds, confirmDeletion, reason } = req.body;

    // Validate input
    if (!Array.isArray(patientIds) || patientIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Patient IDs array is required and cannot be empty',
      });
    }

    // Get user ID from request for audit tracking
    const userId = (req as any).user?.id;
    const user = (req as any).user;
    
    if (!userId || !user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Only admins can perform bulk hard deletions
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Administrative privileges required for bulk permanent deletion',
      });
    }

    if (!confirmDeletion) {
      return res.status(400).json({
        success: false,
        error: 'Deletion confirmation required',
      });
    }

    const result = await GDPRService.bulkHardDeletePatients(req, patientIds, userId);

    return res.json({
      success: result.success,
      message: result.success 
        ? `Successfully permanently deleted ${result.deletedCount} patients and all associated medical records`
        : 'Some permanent deletions failed',
      data: {
        deletedCount: result.deletedCount,
        errors: result.errors,
        deletionReason: reason || 'GDPR Bulk Right to Erasure request',
      },
    });
  } catch (error) {
    console.error('Error bulk hard deleting patients:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to permanently delete patients',
    });
  }
};

// Search patients
export const searchPatients = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      });
    }

    const patients = await prisma.patient.findMany({
      where: {
        isActive: true,
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
          { socialInsuranceNumber: { contains: q } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        insuranceType: true,
      },
      take: 10, // Limit search results
      orderBy: {
        firstName: 'asc',
      },
    });

    return res.json({
      success: true,
      data: patients,
    });
  } catch (error) {
    console.error('Error searching patients:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to search patients',
    });
  }
};