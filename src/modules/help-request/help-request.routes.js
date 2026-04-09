import { Router } from "express";
import { createHelpRequest } from "./help-request.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router = Router();

router.post("/", requireAuth, createHelpRequest);

export default router;