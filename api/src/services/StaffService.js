import prisma from "../db/client.js";
import { toDoc, toDocs } from "../db/present.js";
import { refId, requireUuid } from "../db/ids.js";
import { hashPassword } from "../db/password.js";

const include = { role: true, department: true, restaurant: true };

async function staffWriteData(data) {
  const payload = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.email !== undefined) payload.email = data.email;
  if (data.phone !== undefined) payload.phone = data.phone;
  if (data.isActive !== undefined) payload.isActive = data.isActive;

  const password = data.password || data.passwordHash;
  if (password) payload.passwordHash = await hashPassword(password);

  const roleId = requireUuid(data.role) || requireUuid(data.roleId);
  if (roleId) payload.roleId = roleId;

  if (data.department !== undefined || data.departmentId !== undefined) {
    payload.departmentId = requireUuid(data.department ?? data.departmentId);
  }
  if (data.restaurant !== undefined || data.restaurantId !== undefined) {
    payload.restaurantId = requireUuid(data.restaurant ?? data.restaurantId);
  }
  return payload;
}

class StaffService {
  async getAllStaff(restaurantId, query = {}) {
    const where = { restaurantId: requireUuid(restaurantId) };
    if (query.isActive !== undefined) where.isActive = query.isActive;
    const rows = await prisma.staff.findMany({
      where,
      include,
      orderBy: { createdAt: "desc" },
    });
    return toDocs(rows);
  }

  async getStaffById(id, restaurantId) {
    const staffId = requireUuid(id);
    if (!staffId) return null;
    const row = await prisma.staff.findFirst({
      where: { id: staffId, restaurantId: requireUuid(restaurantId) },
      include,
    });
    return toDoc(row);
  }

  async createStaff(data) {
    const row = await prisma.staff.create({
      data: await staffWriteData(data),
      include,
    });
    return toDoc(row);
  }

  async updateStaff(id, restaurantId, data) {
    const staffId = requireUuid(id);
    if (!staffId) return null;
    const existing = await prisma.staff.findFirst({
      where: { id: staffId, restaurantId: requireUuid(restaurantId) },
    });
    if (!existing) return null;
    const row = await prisma.staff.update({
      where: { id: staffId },
      data: await staffWriteData(data),
      include,
    });
    return toDoc(row);
  }

  async deleteStaff(id, restaurantId) {
    const staffId = requireUuid(id);
    if (!staffId) return null;
    const existing = await prisma.staff.findFirst({
      where: { id: staffId, restaurantId: requireUuid(restaurantId) },
    });
    if (!existing) return null;
    const row = await prisma.staff.delete({ where: { id: staffId } });
    return toDoc(row);
  }

  async toggleStaffStatus(id, restaurantId, isActive) {
    return this.updateStaff(id, restaurantId, { isActive });
  }
}

export default new StaffService();
