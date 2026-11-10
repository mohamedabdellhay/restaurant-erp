import prisma from "../db/client.js";
import { toDoc, toDocs } from "../db/present.js";
import { requireUuid } from "../db/ids.js";

class DepartmentService {
  async getAllDepartments(restaurantId) {
    const rows = await prisma.department.findMany({
      where: { restaurantId: requireUuid(restaurantId) },
      orderBy: { name: "asc" },
    });
    return toDocs(rows);
  }

  async getDepartmentById(id, restaurantId) {
    const departmentId = requireUuid(id);
    if (!departmentId) return null;
    return toDoc(
      await prisma.department.findFirst({
        where: { id: departmentId, restaurantId: requireUuid(restaurantId) },
      }),
    );
  }

  async createDepartment(data) {
    const row = await prisma.department.create({
      data: {
        name: data.name,
        description: data.description,
        isSystemDepartment: Boolean(data.isSystemDepartment),
        restaurantId: requireUuid(data.restaurant || data.restaurantId),
      },
    });
    return toDoc(row);
  }

  async updateDepartment(id, restaurantId, data) {
    const dept = await this.getDepartmentById(id, restaurantId);
    if (!dept) return null;
    if (dept.isSystemDepartment) {
      throw new Error("Cannot modify system departments");
    }
    const payload = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    return toDoc(
      await prisma.department.update({ where: { id: dept.id }, data: payload }),
    );
  }

  async deleteDepartment(id, restaurantId) {
    const dept = await this.getDepartmentById(id, restaurantId);
    if (!dept) return null;
    if (dept.isSystemDepartment) {
      throw new Error("Cannot delete system departments");
    }
    return toDoc(await prisma.department.delete({ where: { id: dept.id } }));
  }

  async seedDefaultDepartments(restaurantId, db = prisma) {
    const defaultDepartments = [
      {
        name: "General",
        description: "General restaurant operations",
        isSystemDepartment: true,
      },
      {
        name: "Kitchen",
        description: "Food preparation and cooking",
        isSystemDepartment: true,
      },
      {
        name: "Service",
        description: "Front-of-house service and dining",
        isSystemDepartment: true,
      },
      {
        name: "Management",
        description: "Administrative and managerial tasks",
        isSystemDepartment: true,
      },
    ];

    try {
      return await db.department.createMany({
        data: defaultDepartments.map((dept) => ({ ...dept, restaurantId })),
        skipDuplicates: true,
      });
    } catch (error) {
      console.log(`Default departments already exist or error: ${error.message}`);
    }
  }
}

export default new DepartmentService();
