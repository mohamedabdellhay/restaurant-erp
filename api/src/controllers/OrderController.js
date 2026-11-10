import OrderService from "../services/OrderService.js";
import asyncHandler from "../utils/asyncHandler.js";
import ResponseHandler from "../utils/responseHandler.js";

class OrderController {
  index = asyncHandler(async (req, res) => {
    const orders = await OrderService.getAllOrders(req.user.restaurant);
    ResponseHandler.success(res, orders, "Orders retrieved successfully");
  });

  getOrderById = asyncHandler(async (req, res) => {
    const order = await OrderService.getOrderById(req.params.id, req.user.restaurant);
    if (!order) {
      return ResponseHandler.error(res, "Order not found", 404);
    }
    ResponseHandler.success(res, order, "Order retrieved successfully");
  });

  create = asyncHandler(async (req, res) => {
    const data = { ...req.body, restaurant: req.user.restaurant };
    const order = await OrderService.createOrder(data, req.user._id);
    ResponseHandler.created(res, order, "Order created successfully");
  });

  update = asyncHandler(async (req, res) => {
    const order = await OrderService.updateOrder(req.params.id, req.user.restaurant, req.body);
    if (!order) {
      return ResponseHandler.error(res, "Order not found", 404);
    }
    ResponseHandler.success(res, order, "Order updated successfully");
  });

  delete = asyncHandler(async (req, res) => {
    const order = await OrderService.deleteOrder(req.params.id, req.user.restaurant);
    if (!order) {
      return ResponseHandler.error(res, "Order not found", 404);
    }
    ResponseHandler.success(res, null, "Order deleted successfully");
  });

  search = asyncHandler(async (req, res) => {
    const query = req.query.q;
    if (!query) {
      return ResponseHandler.error(res, "Search query is required", 400);
    }
    const orders = await OrderService.searchOrders(query, req.user.restaurant);
    ResponseHandler.success(res, orders, "Orders retrieved successfully");
  });

  getPaymentUrl = asyncHandler(async (req, res) => {
    const checkoutUrl = await OrderService.getPaymentUrl(
      req.params.id,
      req.user.restaurant,
      req.get("host"),
    );
    ResponseHandler.success(res, { checkoutUrl }, "Payment link generated successfully");
  });
}

export default new OrderController();
