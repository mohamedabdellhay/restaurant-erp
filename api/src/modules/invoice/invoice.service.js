import prisma from "../../db/client.js";
import { toDoc, toDocs } from "../../db/present.js";
import { requireUuid } from "../../db/ids.js";
import { generateInvoicePDF } from "../../utils/pdfGenerator.js";

const listInclude = {
  order: { select: { id: true, orderNumber: true, total: true, status: true } },
  customer: { select: { id: true, name: true } },
  table: { select: { id: true, number: true } },
  issuedBy: { select: { id: true, name: true } },
  items: { include: { product: { select: { id: true, name: true } } } },
};

class InvoiceService {
  async getInvoiceStatistics(restaurantId) {
    const where = { restaurantId: requireUuid(restaurantId) };
    const [totals, paidCount, unpaidCount] = await Promise.all([
      prisma.invoice.aggregate({
        where,
        _count: true,
        _sum: { grandTotal: true },
        _avg: { grandTotal: true },
      }),
      prisma.invoice.count({ where: { ...where, paymentStatus: "paid" } }),
      prisma.invoice.count({ where: { ...where, paymentStatus: "unpaid" } }),
    ]);

    return {
      totalCount: totals._count || 0,
      totalRevenue: totals._sum.grandTotal || 0,
      averageValue: totals._avg.grandTotal || 0,
      paidCount,
      unpaidCount,
    };
  }

  async getAllInvoices(restaurantId, filter = {}) {
    const where = { restaurantId: requireUuid(restaurantId) };
    if (filter.paymentStatus) where.paymentStatus = filter.paymentStatus;
    const rows = await prisma.invoice.findMany({
      where,
      include: listInclude,
      orderBy: { createdAt: "desc" },
    });
    return toDocs(rows);
  }

  async getInvoiceById(id, restaurantId) {
    const invoiceId = requireUuid(id);
    if (!invoiceId) return null;
    return toDoc(
      await prisma.invoice.findFirst({
        where: { id: invoiceId, restaurantId: requireUuid(restaurantId) },
        include: listInclude,
      }),
    );
  }

  async generateFromOrder(orderId, restaurantId, staffId) {
    const order = await prisma.order.findFirst({
      where: { id: requireUuid(orderId), restaurantId: requireUuid(restaurantId) },
      include: { items: true },
    });
    if (!order) throw new Error("Order not found");

    const subtotal = order.subtotal || 0;
    const row = await prisma.invoice.create({
      data: {
        orderId: order.id,
        restaurantId: requireUuid(restaurantId),
        customerId: order.customerId,
        tableId: order.tableId,
        subTotal: subtotal,
        taxPercent: subtotal ? ((order.tax || 0) / subtotal) * 100 : 0,
        serviceChargePercent: subtotal ? ((order.serviceCharge || 0) / subtotal) * 100 : 0,
        grandTotal: order.total || 0,
        paymentMethod: order.paymentMethod || order.payment?.method || "cash",
        paymentStatus: order.paymentStatus || (order.status === "paid" ? "paid" : "unpaid"),
        issuedById: requireUuid(staffId),
        items: {
          create: order.items.map((item) => ({
            productId: item.menuItemId,
            quantity: item.qty || 1,
            price: item.price,
            total: item.price * (item.qty || 1),
            modifiers: item.modifiers || [],
          })),
        },
      },
      include: listInclude,
    });
    return toDoc(row);
  }

  async updatePaymentStatus(id, restaurantId, status, method) {
    const existing = await this.getInvoiceById(id, restaurantId);
    if (!existing) return null;
    const data = { paymentStatus: status };
    if (method) data.paymentMethod = method;
    return toDoc(
      await prisma.invoice.update({
        where: { id: existing.id },
        data,
        include: listInclude,
      }),
    );
  }

  async deleteInvoice(id, restaurantId) {
    const existing = await this.getInvoiceById(id, restaurantId);
    if (!existing) return null;
    return toDoc(await prisma.invoice.delete({ where: { id: existing.id } }));
  }

  async generateInvoicePDF(invoiceId, restaurantId) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: requireUuid(invoiceId), restaurantId: requireUuid(restaurantId) },
      include: {
        order: true,
        customer: true,
        table: true,
        issuedBy: true,
        items: { include: { product: true } },
      },
    });
    if (!invoice) throw new Error("Invoice not found");
    const [restaurant, platform] = await Promise.all([
      prisma.restaurant.findUnique({ where: { id: requireUuid(restaurantId) } }),
      prisma.platformSetting.findUnique({ where: { id: "default" } }),
    ]);
    return generateInvoicePDF(toDoc(invoice), toDoc(restaurant) ?? {}, toDoc(platform) ?? {});
  }
}

export default new InvoiceService();
