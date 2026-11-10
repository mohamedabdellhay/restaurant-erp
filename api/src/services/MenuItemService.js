import prisma from "../db/client.js";
import { toDoc } from "../db/present.js";
import { refId, requireUuid } from "../db/ids.js";

const include = {
  category: { select: { id: true, name: true } },
  recipeItems: { include: { inventoryItem: true } },
};

function shape(item) {
  if (!item) return null;
  const { recipeItems, ...rest } = item;
  const doc = toDoc({ ...rest, recipe: recipeItems || [] });
  if (!doc.recipe || doc.recipe.length === 0) {
    doc.isAvailable = doc.isActive;
    return doc;
  }
  const ingredientsOk = doc.recipe.every((ingredient) => {
    const inventory = ingredient.inventoryItem;
    if (!inventory || typeof inventory !== "object") return true;
    return inventory.stock >= ingredient.qty;
  });
  doc.isAvailable = doc.isActive && ingredientsOk;
  return doc;
}

class MenuItemService {
  async getAllItems(filter = {}, restaurantId) {
    const where = { restaurantId: requireUuid(restaurantId) };
    if (filter.isActive !== undefined) where.isActive = filter.isActive;
    if (filter.category) where.categoryId = requireUuid(filter.category);
    const rows = await prisma.menuItem.findMany({
      where,
      include,
      orderBy: { name: "asc" },
    });
    return rows.map(shape);
  }

  async getMenuItemById(id, restaurantId) {
    const itemId = requireUuid(id);
    if (!itemId) return null;
    const item = await prisma.menuItem.findFirst({
      where: { id: itemId, restaurantId: requireUuid(restaurantId) },
      include,
    });
    return shape(item);
  }

  async createMenuItem(data) {
    const recipe = Array.isArray(data.recipe) ? data.recipe : [];
    const row = await prisma.menuItem.create({
      data: {
        name: data.name,
        description: data.description,
        image: data.image,
        price: Number(data.price),
        isActive: data.isActive ?? true,
        modifiers: data.modifiers || [],
        categoryId: requireUuid(data.category || data.categoryId),
        restaurantId: requireUuid(data.restaurant || data.restaurantId),
        recipeItems: {
          create: recipe
            .map((entry) => ({
              inventoryItemId: requireUuid(entry.inventoryItem || entry.inventoryItemId),
              qty: Number(entry.qty) || 0,
            }))
            .filter((entry) => entry.inventoryItemId),
        },
      },
      include,
    });
    return shape(row);
  }

  async updateMenuItem(id, restaurantId, data) {
    const existing = await this.getMenuItemById(id, restaurantId);
    if (!existing) return null;

    const payload = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.image !== undefined) payload.image = data.image;
    if (data.price !== undefined) payload.price = Number(data.price);
    if (data.isActive !== undefined) payload.isActive = data.isActive;
    if (data.modifiers !== undefined) payload.modifiers = data.modifiers;
    if (data.category) payload.categoryId = requireUuid(data.category);

    const row = await prisma.$transaction(async (tx) => {
      if (Array.isArray(data.recipe)) {
        await tx.menuRecipeItem.deleteMany({ where: { menuItemId: existing.id } });
        const recipe = data.recipe
          .map((entry) => ({
            menuItemId: existing.id,
            inventoryItemId: requireUuid(refId(entry.inventoryItem) || entry.inventoryItemId),
            qty: Number(entry.qty) || 0,
          }))
          .filter((entry) => entry.inventoryItemId);
        if (recipe.length) await tx.menuRecipeItem.createMany({ data: recipe });
      }
      return tx.menuItem.update({
        where: { id: existing.id },
        data: payload,
        include,
      });
    });
    return shape(row);
  }

  async deleteMenuItem(id, restaurantId) {
    const existing = await this.getMenuItemById(id, restaurantId);
    if (!existing) return null;
    return toDoc(await prisma.menuItem.delete({ where: { id: existing.id } }));
  }

  async getRecipe(id, restaurantId) {
    const item = await this.getMenuItemById(id, restaurantId);
    return item ? item.recipe : null;
  }

  async updateRecipe(id, restaurantId, recipe) {
    return this.updateMenuItem(id, restaurantId, { recipe });
  }
}

export default new MenuItemService();
