import { Router } from "express";
import { authorizeRoles, requireAuth } from "../../middleware/auth.middleware.js";
import {
  createOutletProduct,
  decideOrder,
  decideQc,
  deleteOutletProduct,
  getDispatchQueues,
  getOpsDashboard,
  getOutletProductById,
  listLowStockProducts,
  listNewOrders,
  listOutletProducts,
  listQcPendingOrders,
  listReturnsPending,
  updateOutletProduct,
  updateProductStock,
} from "./operations-manager.controller.js";

const router = Router();

router.use(requireAuth, authorizeRoles("ADMIN", "MANAGER"));

router.get("/dashboard", getOpsDashboard);

router.get("/orders/new", listNewOrders);
router.patch("/orders/:orderId/decision", decideOrder);

router.get("/qc/pending", listQcPendingOrders);
router.patch("/orders/:orderId/qc", decideQc);

router.get("/dispatch", getDispatchQueues);

router.get("/returns", listReturnsPending);

router.get("/inventory/low-stock", listLowStockProducts);
router.patch("/inventory/products/:productId/stock", updateProductStock);

router.get("/products", listOutletProducts);
router.get("/products/:productId", getOutletProductById);
router.post("/products", createOutletProduct);
router.patch("/products/:productId", updateOutletProduct);
router.delete("/products/:productId", deleteOutletProduct);

export default router;
