import { Router } from "express";
import { listBanners } from "./banner.controller.js";

const router = Router();

router.get("/", listBanners);

export default router;
