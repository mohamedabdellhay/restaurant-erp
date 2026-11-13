import prisma from "../../db/client.js";
import { toDoc, toDocs } from "../../db/present.js";
import { requireUuid } from "../../db/ids.js";

function supplierData(data) {
  const payload = {};
  for (const field of ["name", "contactPerson", "phone", "email", "notes", "paymentTerms"]) {
    if (data[field] !== undefined) payload[field] = data[field];
  }
  if (data.address !== undefined) payload.address = data.address;
  if (data.products !== undefined) payload.products = data.products;
  if (data.balance !== undefined) payload.balance = Number(data.balance);
  if (data.isActive !== undefined) payload.isActive = data.isActive;
  if (data.restaurant || data.restaurantId) {
    payload.restaurantId = requireUuid(data.restaurant || data.restaurantId);
  }
  return payload;
}

class SupplierService {
  async getAllSuppliers(restaurantId, filter = {}) {
    const where = { restaurantId: requireUuid(restaurantId) };
    if (filter.isActive !== undefined) where.isActive = filter.isActive;
    const rows = await prisma.supplier.findMany({
      where,
      orderBy: { name: "asc" },
    });
    return toDocs(rows);
  }

  async getSupplierById(id, restaurantId) {
    const supplierId = requireUuid(id);
    if (!supplierId) return null;
    return toDoc(
      await prisma.supplier.findFirst({
        where: { id: supplierId, restaurantId: requireUuid(restaurantId) },
      }),
    );
  }

  async createSupplier(data) {
    return toDoc(await prisma.supplier.create({ data: supplierData(data) }));
  }

  async updateSupplier(id, restaurantId, data) {
    const existing = await this.getSupplierById(id, restaurantId);
    if (!existing) return null;
    return toDoc(
      await prisma.supplier.update({
        where: { id: existing.id },
        data: supplierData(data),
      }),
    );
  }

  async deleteSupplier(id, restaurantId) {
    const existing = await this.getSupplierById(id, restaurantId);
    if (!existing) return null;
    return toDoc(await prisma.supplier.delete({ where: { id: existing.id } }));
  }

  async addPayment(supplierId, restaurantId, data, userId) {
    const supplier = await prisma.supplier.findFirst({
      where: { id: requireUuid(supplierId), restaurantId: requireUuid(restaurantId) },
    });
    if (!supplier) throw new Error("Supplier not found");

    const [transaction] = await prisma.$transaction([
      prisma.supplierTransaction.create({
        data: {
          supplierId: supplier.id,
          restaurantId: supplier.restaurantId,
          type: "payment",
          amount: Number(data.amount),
          description: data.description || "Payment to supplier",
          createdById: requireUuid(userId),
        },
      }),
      prisma.supplier.update({
        where: { id: supplier.id },
        data: { balance: { decrement: Number(data.amount) } },
      }),
    ]);
    return toDoc(transaction);
  }

  async getAccountStatement(supplierId, restaurantId) {
    const supplier = await this.getSupplierById(supplierId, restaurantId);
    if (!supplier) throw new Error("Supplier not found");
    const transactions = await prisma.supplierTransaction.findMany({
      where: { supplierId: supplier.id, restaurantId: requireUuid(restaurantId) },
      orderBy: { createdAt: "desc" },
    });
    return {
      supplier: { name: supplier.name, balance: supplier.balance },
      transactions: toDocs(transactions),
    };
  }
}

export default new SupplierService();
