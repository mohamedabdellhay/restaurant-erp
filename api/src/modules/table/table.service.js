import prisma from "../../db/client.js";
import { toDoc, toDocs } from "../../db/present.js";
import { requireUuid } from "../../db/ids.js";

class TableService {
  async getAllTable(restaurantId) {
    const rows = await prisma.table.findMany({
      where: { restaurantId: requireUuid(restaurantId) },
      orderBy: { number: "asc" },
    });
    return toDocs(rows);
  }

  async getTableById(id, restaurantId) {
    const tableId = requireUuid(id);
    if (!tableId) return null;
    return toDoc(
      await prisma.table.findFirst({
        where: { id: tableId, restaurantId: requireUuid(restaurantId) },
      }),
    );
  }

  async create(data) {
    const row = await prisma.table.create({
      data: {
        number: String(data.number),
        seats: Number(data.seats ?? data.capacity ?? 2),
        status: data.status || "available",
        restaurantId: requireUuid(data.restaurant || data.restaurantId),
      },
    });
    return toDoc(row);
  }

  async update(id, restaurantId, data) {
    const existing = await this.getTableById(id, restaurantId);
    if (!existing) return null;
    const payload = {};
    if (data.number !== undefined) payload.number = String(data.number);
    if (data.seats !== undefined) payload.seats = Number(data.seats);
    if (data.capacity !== undefined) payload.seats = Number(data.capacity);
    if (data.status !== undefined) payload.status = data.status;
    return toDoc(await prisma.table.update({ where: { id: existing.id }, data: payload }));
  }

  async delete(id, restaurantId) {
    const existing = await this.getTableById(id, restaurantId);
    if (!existing) return null;
    return toDoc(await prisma.table.delete({ where: { id: existing.id } }));
  }
}

export default new TableService();
