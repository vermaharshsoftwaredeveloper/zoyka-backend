import { Router } from "express";
import { createBulkOrderInquiry } from "./bulk-order-inquiry.controller.js";

const router = Router();

router.post("/", createBulkOrderInquiry);

export default router;
