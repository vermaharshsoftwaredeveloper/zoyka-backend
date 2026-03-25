import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
  addToWishlist,
  listWishlist,
  removeFromWishlist,
} from "./wishlist.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", listWishlist);
router.post("/", addToWishlist);
router.delete("/:productId", removeFromWishlist);

export default router;
