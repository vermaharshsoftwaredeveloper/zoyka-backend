import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "./cart.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", getCart);
router.post("/items", addCartItem);
router.patch("/items/:itemId", updateCartItem);
router.delete("/items/:itemId", removeCartItem);
router.delete("/clear", clearCart);

export default router;
