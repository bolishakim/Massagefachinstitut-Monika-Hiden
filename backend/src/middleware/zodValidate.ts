import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validateZod = (schema: z.ZodType<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      
      // Replace request objects with validated data
      req.body = result.body || req.body;
      req.query = result.query || req.query;
      req.params = result.params || req.params;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            value: err.code
          }))
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'Internal validation error'
      });
    }
  };
};