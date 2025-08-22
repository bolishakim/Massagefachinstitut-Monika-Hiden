import { z } from 'zod';
import prisma from '../utils/db.js';
import { PasswordUtils } from '../utils/password.js';
// Validation schemas
const createUserSchema = z.object({
    email: z.string().email('Invalid email format'),
    firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['USER', 'MODERATOR', 'ADMIN']).default('USER'),
});
const updateUserSchema = z.object({
    firstName: z.string().min(1, 'First name is required').max(50, 'First name too long').optional(),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long').optional(),
    email: z.string().email('Invalid email format').optional(),
    role: z.enum(['USER', 'MODERATOR', 'ADMIN']).optional(),
    isActive: z.boolean().optional(),
});
const querySchema = z.object({
    page: z.string().optional().transform((val) => val ? parseInt(val) : 1),
    limit: z.string().optional().transform((val) => val ? Math.min(parseInt(val), 100) : 10),
    search: z.string().optional(),
    role: z.enum(['USER', 'MODERATOR', 'ADMIN']).optional(),
    isActive: z.string().optional().transform((val) => val === 'true' ? true : val === 'false' ? false : undefined),
});
const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});
export const getUsers = async (req, res) => {
    try {
        const { page, limit, search, role, isActive } = querySchema.parse(req.query);
        const skip = (page - 1) * limit;
        // Build where clause for filtering
        const where = {};
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (role)
            where.role = role;
        if (isActive !== undefined)
            where.isActive = isActive;
        // Get users with pagination
        const [users, totalCount] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    isActive: true,
                    emailVerified: true,
                    createdAt: true,
                    updatedAt: true,
                    lastLoginAt: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.user.count({ where }),
        ]);
        const totalPages = Math.ceil(totalCount / limit);
        res.json({
            success: true,
            data: users,
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        });
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users',
        });
    }
};
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                emailVerified: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
                phone: true,
                timezone: true,
            },
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
        res.json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user',
        });
    }
};
export const createUser = async (req, res) => {
    try {
        const validatedData = createUserSchema.parse(req.body);
        const { email, firstName, lastName, password, role } = validatedData;
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'User with this email already exists',
            });
        }
        // Validate password strength
        const passwordValidation = PasswordUtils.validate(password);
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                success: false,
                error: 'Password validation failed',
                details: passwordValidation.errors,
            });
        }
        // Hash password
        const hashedPassword = await PasswordUtils.hash(password);
        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                firstName,
                lastName,
                password: hashedPassword,
                role,
                emailVerified: role === 'ADMIN', // Admin users are pre-verified
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                emailVerified: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        res.status(201).json({
            success: true,
            data: user,
            message: 'User created successfully',
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors,
            });
        }
        console.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create user',
        });
    }
};
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = updateUserSchema.parse(req.body);
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id },
        });
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
        // Check if email is being changed and if it's already taken
        if (validatedData.email && validatedData.email !== existingUser.email) {
            const emailTaken = await prisma.user.findUnique({
                where: { email: validatedData.email },
            });
            if (emailTaken) {
                return res.status(409).json({
                    success: false,
                    error: 'Email is already taken by another user',
                });
            }
        }
        // Update user
        const updatedUser = await prisma.user.update({
            where: { id },
            data: validatedData,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                emailVerified: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
            },
        });
        res.json({
            success: true,
            data: updatedUser,
            message: 'User updated successfully',
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors,
            });
        }
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update user',
        });
    }
};
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Prevent self-deletion
        if (req.user && req.user.id === id) {
            return res.status(400).json({
                success: false,
                error: 'You cannot delete your own account',
            });
        }
        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id },
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
        // Instead of deleting, deactivate the user to preserve data integrity
        // This maintains all created records (packages, appointments, etc.) for audit purposes
        const deactivatedUser = await prisma.$transaction(async (tx) => {
            // Log the user deactivation for audit purposes
            if (req.user) {
                await tx.auditLog.create({
                    data: {
                        userId: req.user.id,
                        action: 'UPDATE',
                        tableName: 'users',
                        recordId: id,
                        description: `Admin ${req.user.email} deactivated user ${user.email}`,
                        ipAddress: req.ip || req.connection.remoteAddress,
                        userAgent: req.get('User-Agent'),
                        oldValues: {
                            email: user.email,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            role: user.role,
                            isActive: user.isActive
                        }
                    }
                });
            }
            // Deactivate the user instead of deleting
            const updatedUser = await tx.user.update({
                where: { id },
                data: {
                    isActive: false,
                    // Optionally, you could also clear sensitive fields if needed:
                    // email: `deleted_${Date.now()}_${user.email}`, // Keep original for audit
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    isActive: true,
                    emailVerified: true,
                    createdAt: true,
                    updatedAt: true,
                    lastLoginAt: true,
                },
            });
            // Invalidate all active sessions for this user
            await tx.userSession.deleteMany({
                where: { userId: id }
            });
            return updatedUser;
        });
        res.json({
            success: true,
            data: deactivatedUser,
            message: 'User deactivated successfully (preserving data integrity)',
        });
    }
    catch (error) {
        console.error('Error deactivating user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to deactivate user',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
export const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        // Prevent self-deactivation
        if (req.user && req.user.id === id) {
            return res.status(400).json({
                success: false,
                error: 'You cannot deactivate your own account',
            });
        }
        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id },
            select: { id: true, isActive: true, firstName: true, lastName: true },
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
        // Toggle status
        const updatedUser = await prisma.user.update({
            where: { id },
            data: { isActive: !user.isActive },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                emailVerified: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
            },
        });
        res.json({
            success: true,
            data: updatedUser,
            message: `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`,
        });
    }
    catch (error) {
        console.error('Error toggling user status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to toggle user status',
        });
    }
};
export const changePassword = async (req, res) => {
    try {
        const validatedData = changePasswordSchema.parse(req.body);
        const { currentPassword, newPassword } = validatedData;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated',
            });
        }
        // Get current user with password
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                password: true,
                isActive: true,
            },
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                error: 'Account is deactivated',
            });
        }
        // Verify current password
        const isCurrentPasswordValid = await PasswordUtils.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                error: 'Current password is incorrect',
            });
        }
        // Check if new password is different from current
        const isSamePassword = await PasswordUtils.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                error: 'New password must be different from current password',
            });
        }
        // Hash new password
        const hashedNewPassword = await PasswordUtils.hash(newPassword);
        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedNewPassword,
                updatedAt: new Date(),
            },
        });
        res.json({
            success: true,
            message: 'Password changed successfully',
        });
    }
    catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to change password',
        });
    }
};
//# sourceMappingURL=userController.js.map