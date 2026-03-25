import { Router } from "express";
import { getOutlets } from "./outlet.controller.js";

const router = Router();

router.get("/", getOutlets);

export default router;
