import { Router } from "express";
import { createContactQuery } from "./contact.controller.js";

const router = Router();

router.post("/", createContactQuery);

export default router;
