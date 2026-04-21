import { z } from "zod";

export const getAnalyticsQuerySchema = z.object({
    categoryId: z.string().uuid("Invalid Category ID").optional(),
    regionId: z.string().uuid("Invalid Region ID").optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
});