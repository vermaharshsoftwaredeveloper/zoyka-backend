import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
  createAddress,
  deleteAddress,
  listAddresses,
  updateAddress,
} from "./address.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", listAddresses);
router.post("/", createAddress);
router.patch("/:addressId", updateAddress);
router.delete("/:addressId", deleteAddress);

export default router;
