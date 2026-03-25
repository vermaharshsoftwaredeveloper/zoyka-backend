import { z } from 'zod';

export const dashboardQuerySchema = z.object({
    query: z.object({
        period: z.enum(['HALF_YEARLY', 'YEARLY']).default('HALF_YEARLY'),
    }),
});