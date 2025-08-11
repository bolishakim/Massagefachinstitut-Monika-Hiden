import type { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: error.type === 'field' ? error.path : undefined,
        message: error.msg,
        value: error.type === 'field' ? error.value : undefined,
      })),
    });
  }
  
  next();
};

export const validateRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get user from request (set by auth middleware)
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};