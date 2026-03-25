import { Router } from "express";
import { createHelpRequest } from "./help-request.controller.js";

const router = Router();

router.post("/", createHelpRequest);

export default router;
