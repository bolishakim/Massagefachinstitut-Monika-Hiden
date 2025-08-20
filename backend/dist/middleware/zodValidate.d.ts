import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
export declare const validateZod: (schema: z.ZodType<any>) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=zodValidate.d.ts.map