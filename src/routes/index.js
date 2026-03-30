import { Router } from "express";

import authRouter from "../modules/auth/auth.routes.js";
import outletRouter from "../modules/outlet/outlet.routes.js";
import categoryRouter from "../modules/category/category.routes.js";
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
import adminProductRouter from "../modules/admin-product/admin-product.routes.js";
import adminOutletRouter from "../modules/admin-outlet/admin-outlet.routes.js";
import adminTestimonialRouter from "../modules/admin-testimonial/admin-testimonial.routes.js";
import adminCouponRouter from "../modules/admin-coupon/admin-coupon.routes.js";
import bannerRouter from "../modules/banner/banner.routes.js";
import adminBannerRouter from "../modules/admin-banner/admin-banner.routes.js";
import adminDashboardRoutes from '../modules/admin/dashboard.routes.js';
import adminCategoryRoutes from '../modules/category/admin-category.routes.js';
import adminRegionRoutes from '../modules/region/admin-region.routes.js';
import staffRoutes from '../modules/admin/staff.routes.js';
import adminOutletRoutes from '../modules/outlet/admin-outlet.routes.js';
import adminArtisanRoutes from '../modules/artisan/admin-artisan.routes.js';
import adminOrderRoutes from '../modules/order/admin-order.routes.js';
import operationsManagerRoutes from "../modules/operations-manager/operations-manager.routes.js";
import adminFinanceRoutes from "../modules/finance/admin-finance.routes.js";
import adminCustomerRoutes from "../modules/customer/admin-customer.routes.js";
import adminAnalyticsRoutes from "../modules/analytics/admin-analytics.routes.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ status: "Zoyka backend is running 🔥" });
});

router.use("/auth", authRouter);
router.use("/outlets", outletRouter);
router.use("/categories", categoryRouter);
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
router.use("/banners", bannerRouter);


// Admin Routes
router.use("/admin/products", adminProductRouter);
router.use("/admin/outlets", adminOutletRouter);
router.use("/admin/testimonials", adminTestimonialRouter);
router.use("/admin/coupons", adminCouponRouter);
router.use("/admin/banners", adminBannerRouter);
router.use("/ops", operationsManagerRoutes);
router.use("/admin", adminDashboardRoutes);
router.use("/admin/categories", adminCategoryRoutes);
router.use("/admin/regions", adminRegionRoutes);
router.use("/admin/staff", staffRoutes);
router.use("/admin/outlets", adminOutletRoutes);
router.use("/admin/artisans", adminArtisanRoutes);
router.use("/admin/orders", adminOrderRoutes);
router.use("/admin/finance", adminFinanceRoutes);
router.use("/admin/customers", adminCustomerRoutes);
router.use("/admin/analytics", adminAnalyticsRoutes);

export default router;