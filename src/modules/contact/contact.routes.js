import { Router } from "express";
import { createContactQuery } from "./contact.controller.js";
import { requireAuth } from "../../middlewares/auth.js";

const router = Router();

router.post("/", requireAuth, createContactQuery);

export default router;
