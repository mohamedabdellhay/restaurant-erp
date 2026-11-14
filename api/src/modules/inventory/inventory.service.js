import prisma from "../../db/client.js";
import { toDoc, toDocs } from "../../db/present.js";
import { requireUuid } from "../../db/ids.js";
import AppError from "../../utils/errors/AppError.js";

const listInclude = {
  supplier: { select: { id: true, name: true, email: true, phone: true, contactPerson: true } },
  restaurant: { select: { id: true, name: true } },
  ingredientCategory: { select: { id: true, name: true } },
};

class InventoryService {
  async resolveCategory(restaurantId, categoryId) {
    if (categoryId === undefined) return undefined;
    if (categoryId === "" || categoryId == null) return null;
    const id = requireUuid(categoryId);
    const category = await prisma.ingredientCategory.findFirst({
      where: { id, restaurantId: requireUuid(restaurantId) },
    });
    if (!category) throw new AppError("Category not found", 400);
    return category.id;
  }

  async getAllItems(restaurantId, filter = {}) {
    const where = { restaurantId: requireUuid(restaurantId) };
    if (filter.supplier) where.supplierId = requireUuid(filter.supplier);
    const rows = await prisma.inventoryItem.findMany({
      where,
      include: listInclude,
      orderBy: { name: "asc" },
    });
    return toDocs(rows);
  }

  async getItemById(id, restaurantId) {
    const itemId = requireUuid(id);
    if (!itemId) return null;
    return toDoc(
      await prisma.inventoryItem.findFirst({
        where: { id: itemId, restaurantId: requireUuid(restaurantId) },
        include: listInclude,
      }),
    );
  }

  async createItem(data) {
    const row = await prisma.inventoryItem.create({
      data: {
        name: data.name,
        sku: data.sku,
        unit: data.unit,
        costPrice: data.costPrice != null ? Number(data.costPrice) : null,
        stock: data.stock != null ? Number(data.stock) : 0,
        minStockAlert: data.minStockAlert != null ? Number(data.minStockAlert) : 0,
        supplierId: requireUuid(data.supplier || data.supplierId),
        restaurantId: requireUuid(data.restaurant || data.restaurantId),
        ingredientCategoryId: await this.resolveCategory(
          data.restaurant || data.restaurantId,
          data.ingredientCategoryId,
        ),
      },
      include: listInclude,
    });
    return toDoc(row);
  }

  async updateItem(id, restaurantId, data) {
    const existing = await this.getItemById(id, restaurantId);
    if (!existing) return null;
    const payload = {};
    for (const field of ["name", "sku", "unit"]) {
      if (data[field] !== undefined) payload[field] = data[field];
    }
    if (data.costPrice !== undefined) payload.costPrice = Number(data.costPrice);
    if (data.stock !== undefined) payload.stock = Number(data.stock);
    if (data.minStockAlert !== undefined) payload.minStockAlert = Number(data.minStockAlert);
    if (data.supplier) payload.supplierId = requireUuid(data.supplier);
    if (data.ingredientCategoryId !== undefined) {
      payload.ingredientCategoryId = await this.resolveCategory(
        restaurantId,
        data.ingredientCategoryId,
      );
    }
    return toDoc(
      await prisma.inventoryItem.update({
        where: { id: existing.id },
        data: payload,
        include: listInclude,
      }),
    );
  }

  async updateStock(id, restaurantId, amount, type = "addition", userId) {
    const item = await prisma.inventoryItem.findFirst({
      where: { id: requireUuid(id), restaurantId: requireUuid(restaurantId) },
    });
    if (!item) throw new Error("Inventory item not found");

    const delta = type === "addition" ? Number(amount) : -Number(amount);
    const saved = await prisma.inventoryItem.update({
      where: { id: item.id },
      data: { stock: item.stock + delta },
    });

    const movement = await prisma.stockMovement.create({
      data: {
        inventoryItemId: item.id,
        qty: delta,
        type: type === "addition" ? "purchase" : "adjustment",
        createdById: requireUuid(userId),
      },
    });

    if (type === "addition" && item.supplierId) {
      const purchaseAmount = Number(amount) * (item.costPrice || 0);
      await prisma.supplierTransaction.create({
        data: {
          supplierId: item.supplierId,
          restaurantId: requireUuid(restaurantId),
          type: "purchase",
          amount: purchaseAmount,
          description: `Purchased ${amount} ${item.unit || ""} of ${item.name}`.trim(),
          referenceId: movement.id,
          createdById: requireUuid(userId),
        },
      });
      await prisma.supplier.update({
        where: { id: item.supplierId },
        data: { balance: { increment: purchaseAmount } },
      });
    }

    return toDoc(saved);
  }

  async deleteItem(id, restaurantId) {
    const existing = await this.getItemById(id, restaurantId);
    if (!existing) return null;
    return toDoc(await prisma.inventoryItem.delete({ where: { id: existing.id } }));
  }

  async getLowStockItems(restaurantId) {
    const rows = await prisma.$queryRaw`
      SELECT i.*
      FROM inventory_items i
      WHERE i."restaurantId" = ${requireUuid(restaurantId)}
        AND i.stock <= i."minStockAlert"
      ORDER BY i.name ASC
    `;
    const ids = rows.map((row) => row.id);
    if (!ids.length) return [];
    const items = await prisma.inventoryItem.findMany({
      where: { id: { in: ids } },
      include: { supplier: { select: { id: true, name: true, email: true } } },
      orderBy: { name: "asc" },
    });
    return toDocs(items);
  }
}

export default new InventoryService();
