import prisma from "../../db/client.js";
import { toDoc, toDocs } from "../../db/present.js";
import { requireUuid } from "../../db/ids.js";

class InventoryItemService {
  async getAllItems() {
    return toDocs(await prisma.inventoryItem.findMany({ orderBy: { name: "asc" } }));
  }

  async getItemById(id) {
    const itemId = requireUuid(id);
    if (!itemId) return null;
    return toDoc(await prisma.inventoryItem.findUnique({ where: { id: itemId } }));
  }

  async createItem(data) {
    return toDoc(
      await prisma.inventoryItem.create({
        data: {
          name: data.name,
          sku: data.sku,
          unit: data.unit,
          costPrice: data.costPrice != null ? Number(data.costPrice) : null,
          stock: data.stock != null ? Number(data.stock) : 0,
          minStockAlert: data.minStockAlert != null ? Number(data.minStockAlert) : 0,
          supplierId: requireUuid(data.supplier || data.supplierId),
          restaurantId: requireUuid(data.restaurant || data.restaurantId),
        },
      }),
    );
  }

  async updateItem(id, data) {
    const itemId = requireUuid(id);
    if (!itemId) return null;
    const payload = {};
    for (const field of ["name", "sku", "unit"]) {
      if (data[field] !== undefined) payload[field] = data[field];
    }
    if (data.costPrice !== undefined) payload.costPrice = Number(data.costPrice);
    if (data.stock !== undefined) payload.stock = Number(data.stock);
    if (data.minStockAlert !== undefined) payload.minStockAlert = Number(data.minStockAlert);
    return toDoc(await prisma.inventoryItem.update({ where: { id: itemId }, data: payload }));
  }

  async deleteItem(id) {
    const itemId = requireUuid(id);
    if (!itemId) return null;
    return toDoc(await prisma.inventoryItem.delete({ where: { id: itemId } }));
  }
}

export default new InventoryItemService();
