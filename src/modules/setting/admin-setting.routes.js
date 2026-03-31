import { Router } from "express";
import {
    getAllSettings,
    getSettingByKey,
    createSetting,
    updateSettingByKey,
    deleteSettingByKey
} from "./admin-setting.controller.js";
import { requireAuth, authorizeRoles } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth, authorizeRoles("SUPER_ADMIN", "ADMIN"));

router.get("/", getAllSettings);
router.post("/", createSetting);
router.get("/:key", getSettingByKey);
router.patch("/:key", updateSettingByKey);
router.delete("/:key", deleteSettingByKey);

export default router;