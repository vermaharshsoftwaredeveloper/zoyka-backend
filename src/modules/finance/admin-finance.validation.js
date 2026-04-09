import { z } from "zod";

export const getFinanceQuerySchema = z.object({
    vertical: z.enum(["FOOD", "ARTISAN", "FARM"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
});