import { Router } from "express";
import { createContactQuery } from "./contact.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router = Router();

router.post("/", requireAuth, createContactQuery);

export default router;
