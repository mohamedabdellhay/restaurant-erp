import AppError from "../../utils/errors/AppError.js";

const CONSUMING_STATUSES = new Set([
  "in_kitchen",
  "served",
  "out_for_delivery",
  "delivered",
  "paid",
]);

export function consumesStock(status) {
  return CONSUMING_STATUSES.has(status);
}

function formatQty(value) {
  const number = Number(value) || 0;
  return Number.isInteger(number) ? String(number) : String(Math.round(number * 1000) / 1000);
}

export async function recipeNeeds(tx, lines) {
  const needs = new Map();
  for (const line of lines || []) {
    const menuItemId = line.menuItemId;
    const portions = Number(line.qty) || 0;
    if (!menuItemId || portions <= 0) continue;

    const recipe = await tx.menuRecipeItem.findMany({
      where: { menuItemId },
      include: { inventoryItem: { select: { id: true, name: true, unit: true } } },
    });

    for (const entry of recipe) {
      const amount = Number(entry.qty) * portions;
      if (!amount) continue;
      const current = needs.get(entry.inventoryItemId) || {
        qty: 0,
        name: entry.inventoryItem?.name || "ingredient",
        unit: entry.inventoryItem?.unit || "",
      };
      current.qty += amount;
      needs.set(entry.inventoryItemId, current);
    }
  }
  return needs;
}

export async function assertStock(tx, needs) {
  const shortages = [];
  for (const [id, need] of needs) {
    const item = await tx.inventoryItem.findUnique({ where: { id } });
    const have = item?.stock ?? 0;
    if (have + 1e-9 < need.qty) {
      shortages.push(
        `${need.name}: need ${formatQty(need.qty)} ${need.unit}, in stock ${formatQty(have)} ${need.unit}`.trim(),
      );
    }
  }
  if (shortages.length) {
    throw new AppError(`Not enough stock to make this order. ${shortages.join("; ")}`, 400);
  }
}

async function writeMovement(tx, { inventoryItemId, qty, userId, orderId }) {
  await tx.stockMovement.create({
    data: {
      inventoryItemId,
      qty,
      type: qty < 0 ? "sale" : "return",
      refId: orderId,
      createdById: userId || null,
    },
  });
}

/**
 * Move stock from the previous recipe usage to the next one.
 * A positive difference returns stock. A negative difference consumes it.
 */
export async function applyStockDelta(tx, previous, next, { userId, orderId }) {
  const delta = new Map();
  for (const [id, need] of previous || []) delta.set(id, need.qty);
  for (const [id, need] of next || []) delta.set(id, (delta.get(id) || 0) - need.qty);

  for (const [id, change] of delta) {
    if (Math.abs(change) < 1e-9) continue;
    if (change < 0) {
      const need = -change;
      const updated = await tx.inventoryItem.updateMany({
        where: { id, stock: { gte: need } },
        data: { stock: { decrement: need } },
      });
      if (updated.count !== 1) {
        const item = await tx.inventoryItem.findUnique({ where: { id } });
        const label = next.get(id)?.name || previous.get(id)?.name || item?.name || "an ingredient";
        const unit = next.get(id)?.unit || previous.get(id)?.unit || item?.unit || "";
        throw new AppError(
          `Not enough ${label} to make this order. Need ${formatQty(need)} ${unit}, in stock ${formatQty(item?.stock ?? 0)} ${unit}.`.trim(),
          400,
        );
      }
    } else {
      await tx.inventoryItem.update({
        where: { id },
        data: { stock: { increment: change } },
      });
    }
    await writeMovement(tx, { inventoryItemId: id, qty: change, userId, orderId });
  }
}
