import { Router } from "express";
import { uploadFile } from "./upload.controller.js";
import { uploadMiddleware } from "../../config/supabase.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router = Router();

// We requireAuth so random people on the internet can't fill up your Supabase storage!
// The frontend must send the file under the key "file"
router.post("/", requireAuth, uploadMiddleware.single("file"), uploadFile);

export default router;