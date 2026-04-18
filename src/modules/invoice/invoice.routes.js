import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { getInvoiceByOrderId, listInvoices } from "./invoice.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", listInvoices);
router.get("/order/:orderId", getInvoiceByOrderId);

export default router;
