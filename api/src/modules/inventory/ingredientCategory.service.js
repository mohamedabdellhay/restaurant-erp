import prisma from "../../db/client.js";
import { toDoc, toDocs } from "../../db/present.js";
import { requireUuid } from "../../db/ids.js";

class IngredientCategoryService {
  async list(restaurantId) {
    const rows = await prisma.ingredientCategory.findMany({
      where: { restaurantId: requireUuid(restaurantId) },
      orderBy: { name: "asc" },
    });
    return toDocs(rows);
  }

  async findByName(restaurantId, name, exceptId) {
    return prisma.ingredientCategory.findFirst({
      where: {
        restaurantId: requireUuid(restaurantId),
        name: { equals: name, mode: "insensitive" },
        ...(exceptId ? { NOT: { id: exceptId } } : {}),
      },
    });
  }

  async create(restaurantId, name) {
    const row = await prisma.ingredientCategory.create({
      data: { name, restaurantId: requireUuid(restaurantId) },
    });
    return toDoc(row);
  }

  async update(id, restaurantId, name) {
    const existing = await prisma.ingredientCategory.findFirst({
      where: { id: requireUuid(id), restaurantId: requireUuid(restaurantId) },
    });
    if (!existing) return null;
    return toDoc(
      await prisma.ingredientCategory.update({
        where: { id: existing.id },
        data: { name },
      }),
    );
  }

  async remove(id, restaurantId) {
    const existing = await prisma.ingredientCategory.findFirst({
      where: { id: requireUuid(id), restaurantId: requireUuid(restaurantId) },
    });
    if (!existing) return null;
    await prisma.ingredientCategory.delete({ where: { id: existing.id } });
    return toDoc(existing);
  }
}

export default new IngredientCategoryService();
