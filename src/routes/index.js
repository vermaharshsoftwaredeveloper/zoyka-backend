import { Router } from "express";

import authRouter from "../modules/auth/auth.routes.js";
import outletRouter from "../modules/outlet/outlet.routes.js";
import productRouter from "../modules/product/product.routes.js";
import reviewRouter from "../modules/review/review.routes.js";
import reviewPublicRouter from "../modules/review/review-public.routes.js";
import addressRouter from "../modules/address/address.routes.js";
import wishlistRouter from "../modules/wishlist/wishlist.routes.js";
import cartRouter from "../modules/cart/cart.routes.js";
import orderRouter from "../modules/order/order.routes.js";
import contactRouter from "../modules/contact/contact.routes.js";
import bulkOrderInquiryRouter from "../modules/bulk-order-inquiry/bulk-order-inquiry.routes.js";
import helpRequestRouter from "../modules/help-request/help-request.routes.js";
import userProfileRouter from "../modules/user-profile/user-profile.routes.js";
import adminDashboardRoutes from '../modules/admin/dashboard.routes.js';
import adminCategoryRoutes from '../modules/category/admin-category.routes.js';
import adminRegionRoutes from '../modules/region/admin-region.routes.js';
import staffRoutes from '../modules/admin/staff.routes.js';
import adminOutletRoutes from '../modules/outlet/admin-outlet.routes.js';
import adminArtisanRoutes from '../modules/artisan/admin-artisan.routes.js';
import adminOrderRoutes from '../modules/order/admin-order.routes.js';

const router = Router();

router.get("/health", (req, res) => {
  res.json({ status: "Zoyka backend is running 🔥" });
});

router.use("/auth", authRouter);
router.use("/outlets", outletRouter);
router.use("/products", productRouter);
router.use("/products/:productId/reviews", reviewRouter);
router.use("/reviews", reviewPublicRouter);
router.use("/addresses", addressRouter);
router.use("/wishlist", wishlistRouter);
router.use("/cart", cartRouter);
router.use("/orders", orderRouter);
router.use("/contact-us", contactRouter);
router.use("/bulk-order-inquiries", bulkOrderInquiryRouter);
router.use("/payment-delivery-help", helpRequestRouter);
router.use("/profile", userProfileRouter);
router.use("/admin", adminDashboardRoutes);
router.use("/admin/categories", adminCategoryRoutes);
router.use("/admin/regions", adminRegionRoutes);
router.use("/admin/staff", staffRoutes);
router.use("/admin/outlets", adminOutletRoutes);
router.use("/admin/artisans", adminArtisanRoutes);
router.use("/admin/orders", adminOrderRoutes);

export default router;
