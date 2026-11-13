import prisma from "../../db/client.js";
import { toDoc, toDocs } from "../../db/present.js";
import { requireUuid } from "../../db/ids.js";

class RoleService {
  async getAllRoles(restaurantId) {
    const rows = await prisma.role.findMany({
      where: { restaurantId: requireUuid(restaurantId) },
      orderBy: { name: "asc" },
    });
    return toDocs(rows);
  }

  async getRoleById(id, restaurantId) {
    const roleId = requireUuid(id);
    if (!roleId) return null;
    return toDoc(
      await prisma.role.findFirst({
        where: { id: roleId, restaurantId: requireUuid(restaurantId) },
      }),
    );
  }

  async createRole(data) {
    const row = await prisma.role.create({
      data: {
        name: data.name,
        permissions: data.permissions || [],
        isSystemRole: Boolean(data.isSystemRole),
        restaurantId: requireUuid(data.restaurant || data.restaurantId),
      },
    });
    return toDoc(row);
  }

  async updateRole(id, restaurantId, data) {
    const role = await this.getRoleById(id, restaurantId);
    if (!role) return null;
    if (role.isSystemRole && role.name === "Owner") {
      throw new Error("Cannot modify the Owner role");
    }
    const payload = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.permissions !== undefined) payload.permissions = data.permissions;
    const row = await prisma.role.update({ where: { id: role.id }, data: payload });
    return toDoc(row);
  }

  async deleteRole(id, restaurantId) {
    const role = await this.getRoleById(id, restaurantId);
    if (!role) return null;
    if (role.isSystemRole && role.name === "Owner") {
      throw new Error("Cannot delete the Owner role");
    }
    return toDoc(await prisma.role.delete({ where: { id: role.id } }));
  }

  async seedDefaultRoles(restaurantId, db = prisma) {
    const { PERMISSIONS, ALL_PERMISSIONS } = await import(
      "../../utils/constants/permissions.js"
    );

    const defaultRoles = [
      { name: "Owner", permissions: ALL_PERMISSIONS, isSystemRole: true },
      { name: "Admin", permissions: ALL_PERMISSIONS, isSystemRole: true },
      {
        name: "Manager",
        permissions: [
          PERMISSIONS.VIEW_DASHBOARD,
          PERMISSIONS.VIEW_STAFF,
          PERMISSIONS.VIEW_MENU,
          PERMISSIONS.MANAGE_MENU,
          PERMISSIONS.VIEW_CATEGORIES,
          PERMISSIONS.MANAGE_CATEGORIES,
          PERMISSIONS.VIEW_INVENTORY,
          PERMISSIONS.MANAGE_INVENTORY,
          PERMISSIONS.VIEW_ORDERS,
          PERMISSIONS.MANAGE_ORDERS,
          PERMISSIONS.VIEW_RESERVATIONS,
          PERMISSIONS.MANAGE_RESERVATIONS,
          PERMISSIONS.VIEW_TABLES,
          PERMISSIONS.MANAGE_TABLES,
          PERMISSIONS.VIEW_REPORTS,
          PERMISSIONS.VIEW_INVOICES,
          PERMISSIONS.VIEW_CUSTOMERS,
          PERMISSIONS.MANAGE_CUSTOMERS,
        ],
        isSystemRole: true,
      },
      {
        name: "Cashier",
        permissions: [
          PERMISSIONS.VIEW_DASHBOARD,
          PERMISSIONS.VIEW_MENU,
          PERMISSIONS.VIEW_CATEGORIES,
          PERMISSIONS.VIEW_ORDERS,
          PERMISSIONS.MANAGE_ORDERS,
          PERMISSIONS.VIEW_TABLES,
          PERMISSIONS.VIEW_INVOICES,
          PERMISSIONS.MANAGE_INVOICES,
          PERMISSIONS.VIEW_CUSTOMERS,
          PERMISSIONS.MANAGE_CUSTOMERS,
        ],
        isSystemRole: true,
      },
      {
        name: "Chef",
        permissions: [
          PERMISSIONS.VIEW_DASHBOARD,
          PERMISSIONS.VIEW_MENU,
          PERMISSIONS.VIEW_ORDERS,
          PERMISSIONS.VIEW_INVENTORY,
        ],
        isSystemRole: true,
      },
      {
        name: "Waiter",
        permissions: [
          PERMISSIONS.VIEW_DASHBOARD,
          PERMISSIONS.VIEW_MENU,
          PERMISSIONS.VIEW_ORDERS,
          PERMISSIONS.MANAGE_ORDERS,
          PERMISSIONS.VIEW_TABLES,
          PERMISSIONS.VIEW_RESERVATIONS,
          PERMISSIONS.MANAGE_RESERVATIONS,
        ],
        isSystemRole: true,
      },
    ];

    return db.role.createMany({
      data: defaultRoles.map((role) => ({
        ...role,
        restaurantId,
      })),
      skipDuplicates: true,
    });
  }
}

export default new RoleService();
