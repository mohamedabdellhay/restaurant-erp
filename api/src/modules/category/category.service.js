import prisma from "../../db/client.js";
import { toDoc, toDocs } from "../../db/present.js";
import { requireUuid } from "../../db/ids.js";

class CategoryService {
  async getAllCategories(restaurantId) {
    const rows = await prisma.category.findMany({
      where: { restaurantId: requireUuid(restaurantId) },
      orderBy: { name: "asc" },
    });
    return toDocs(rows);
  }

  async getCategoryById(id, restaurantId) {
    const categoryId = requireUuid(id);
    if (!categoryId) return null;
    return toDoc(
      await prisma.category.findFirst({
        where: { id: categoryId, restaurantId: requireUuid(restaurantId) },
      }),
    );
  }

  async createCategory(data) {
    const row = await prisma.category.create({
      data: {
        name: data.name,
        description: data.description,
        image: data.image,
        isActive: data.isActive ?? true,
        restaurantId: requireUuid(data.restaurant || data.restaurantId),
      },
    });
    return toDoc(row);
  }

  async updateCategory(id, restaurantId, data) {
    const existing = await this.getCategoryById(id, restaurantId);
    if (!existing) return null;
    const payload = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.image !== undefined) payload.image = data.image;
    if (data.isActive !== undefined) payload.isActive = data.isActive;
    return toDoc(
      await prisma.category.update({ where: { id: existing.id }, data: payload }),
    );
  }

  async deleteCategory(id, restaurantId) {
    const existing = await this.getCategoryById(id, restaurantId);
    if (!existing) return null;
    return toDoc(await prisma.category.delete({ where: { id: existing.id } }));
  }
}

export default new CategoryService();
