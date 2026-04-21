import { z } from "zod";

export const getOrdersQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional(),
    categoryId: z.string().uuid("Invalid Category ID").optional(),
    regionId: z.string().uuid("Invalid Region ID").optional(),
    outletId: z.string().uuid("Invalid Outlet ID").optional(),
    status: z.enum(["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]).optional(),
    dateRange: z.enum(["this_week", "this_month", "custom"]).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
}).refine(data => {
    if (data.dateRange === 'custom' && (!data.startDate || !data.endDate)) {
        return false;
    }
    return true;
}, { message: "startDate and endDate are required when dateRange is 'custom'" });