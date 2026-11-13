import express from "express";
import "dotenv/config";
const router = express.Router();

// import swagger docs
import swaggerRoute from "./swaggerRoutes.js";
// import all routes modules
import authRoutes from "../modules/auth/index.js";
import reportRoutes from "../modules/report/index.js";
import categoryRoutes from "../modules/category/index.js";
import inventoryRoutes from "../modules/inventory/index.js";
import invoiceRoutes from "../modules/invoice/index.js";
import orderRoutes from "../modules/order/index.js";
import menuRoutes from "../modules/menu/index.js";
import reservationRoutes from "../modules/reservation/index.js";
import tableRoutes from "../modules/table/index.js";
import roleRoutes from "../modules/role/index.js";
import staffRoutes from "../modules/staff/index.js";
import restaurantRoutes from "../modules/restaurant/index.js";
import subscriptionRoutes from "../modules/subscription/index.js";
import customerRoutes from "../modules/customer/index.js";
import dashboardRoutes from "../modules/dashboard/index.js";
import uploadRoutes from "../modules/upload/index.js";
import departmentRoutes from "../modules/department/index.js";
import permissionRoutes from "../modules/permission/index.js";
import paymentRoutes from "../modules/payment/index.js";
import adminRoutes from "../modules/admin/index.js";


// mount all routes
if (process.env.NODE_ENV === "development") {
  router.use("/docs", swaggerRoute);
} else {
  console.log("Swagger UI disabled in production");
}

router.use("/auth", authRoutes);
router.use("/reports", reportRoutes);
router.use("/categories", categoryRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/orders", orderRoutes);
router.use("/menu", menuRoutes);
router.use("/reservations", reservationRoutes);
router.use("/tables", tableRoutes);
router.use("/roles", roleRoutes);
router.use("/staff", staffRoutes);
router.use("/restaurant", restaurantRoutes);
router.use("/subscription", subscriptionRoutes);
router.use("/customers", customerRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/upload", uploadRoutes);
router.use("/departments", departmentRoutes);
router.use("/permissions", permissionRoutes);
router.use("/payments", paymentRoutes);
router.use("/admin", adminRoutes);


export default router;
