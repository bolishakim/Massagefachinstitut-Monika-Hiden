import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
const router = Router();
const prisma = new PrismaClient();
/**
 * Get audit logs for a specific table/record
 * GET /api/audit/logs?tableName=Patient&recordId=uuid&limit=20&page=1
 */
router.get('/logs', authenticateToken, async (req, res) => {
    try {
        const { tableName, recordId, limit = '20', page = '1', } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (tableName)
            where.tableName = tableName;
        if (recordId)
            where.recordId = recordId;
        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum,
            }),
            prisma.auditLog.count({ where }),
        ]);
        const pages = Math.ceil(total / limitNum);
        res.json({
            success: true,
            data: logs,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages,
            },
        });
    }
    catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch audit logs',
        });
    }
});
/**
 * Get audit logs for all tables - Admin only
 * GET /api/audit/logs/all
 */
router.get('/logs/all', authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        // Check if user is admin
        if (user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Admin role required.',
            });
        }
        const { limit = '50', page = '1', action, userId: filterUserId, tableName, } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (action)
            where.action = action;
        if (filterUserId)
            where.userId = filterUserId;
        if (tableName)
            where.tableName = tableName;
        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            role: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum,
            }),
            prisma.auditLog.count({ where }),
        ]);
        const pages = Math.ceil(total / limitNum);
        res.json({
            success: true,
            data: logs,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages,
            },
        });
    }
    catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch audit logs',
        });
    }
});
/**
 * Get audit statistics - Admin only
 * GET /api/audit/stats
 */
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        // Check if user is admin
        if (user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Admin role required.',
            });
        }
        const [totalLogs, actionStats, tableStats, userStats,] = await Promise.all([
            prisma.auditLog.count(),
            prisma.auditLog.groupBy({
                by: ['action'],
                _count: {
                    action: true,
                },
            }),
            prisma.auditLog.groupBy({
                by: ['tableName'],
                _count: {
                    tableName: true,
                },
                orderBy: {
                    _count: {
                        tableName: 'desc',
                    },
                },
            }),
            prisma.auditLog.groupBy({
                by: ['userId'],
                _count: {
                    userId: true,
                },
                orderBy: {
                    _count: {
                        userId: 'desc',
                    },
                },
                take: 10,
            }),
        ]);
        // Get user details for top users
        const userIds = userStats.map(stat => stat.userId);
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
            },
        });
        const topUsers = userStats.map(stat => ({
            ...stat,
            user: users.find(u => u.id === stat.userId),
        }));
        res.json({
            success: true,
            data: {
                totalLogs,
                actionStats,
                tableStats,
                topUsers,
            },
        });
    }
    catch (error) {
        console.error('Error fetching audit statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch audit statistics',
        });
    }
});
export default router;
//# sourceMappingURL=audit.js.map