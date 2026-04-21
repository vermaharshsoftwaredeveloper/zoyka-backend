import { Router } from "express";
import { getAllCustomers, getCustomerById, getNewCustomers, verifyCustomer } from "./admin-customer.controller.js";
import { requireAuth, authorizeRoles } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth, authorizeRoles("ADMIN", "MANAGER"));

router.get("/", getAllCustomers);
router.get("/new", getNewCustomers);
router.get("/:id", getCustomerById);
router.patch("/:id/verify", verifyCustomer);

export default router;