import { z } from "zod";

export const getRegionsQuerySchema = z.object({
  departmentId: z.string().uuid("Invalid Department ID").optional(),
});
