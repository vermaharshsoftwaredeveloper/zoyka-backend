import { Router } from "express";
import { getOutlets, getOutletDetail } from "./outlet.controller.js";

const router = Router();

router.get("/", getOutlets);
router.get("/:id", getOutletDetail);

export default router;
