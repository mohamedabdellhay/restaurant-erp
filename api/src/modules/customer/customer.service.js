import prisma from "../../db/client.js";
import { toDoc, toDocs } from "../../db/present.js";
import { requireUuid } from "../../db/ids.js";

class CustomerService {
  async getAll(restaurantId) {
    const rows = await prisma.customer.findMany({
      where: { restaurantId: requireUuid(restaurantId) },
      orderBy: { createdAt: "desc" },
    });
    return toDocs(rows);
  }

  async getById(id, restaurantId) {
    const customerId = requireUuid(id);
    if (!customerId) return null;
    return toDoc(
      await prisma.customer.findFirst({
        where: { id: customerId, restaurantId: requireUuid(restaurantId) },
      }),
    );
  }

  async create(data) {
    const row = await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        restaurantId: requireUuid(data.restaurant || data.restaurantId),
      },
    });
    return toDoc(row);
  }

  async update(id, restaurantId, data) {
    const existing = await this.getById(id, restaurantId);
    if (!existing) return null;
    const payload = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.phone !== undefined) payload.phone = data.phone;
    if (data.email !== undefined) payload.email = data.email;
    if (data.address !== undefined) payload.address = data.address;
    return toDoc(await prisma.customer.update({ where: { id: existing.id }, data: payload }));
  }

  async delete(id, restaurantId) {
    const existing = await this.getById(id, restaurantId);
    if (!existing) return null;
    return toDoc(await prisma.customer.delete({ where: { id: existing.id } }));
  }

  async search(query, restaurantId) {
    if (!query) return [];
    const rows = await prisma.customer.findMany({
      where: {
        restaurantId: requireUuid(restaurantId),
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
    return toDocs(rows);
  }
}

export default new CustomerService();
