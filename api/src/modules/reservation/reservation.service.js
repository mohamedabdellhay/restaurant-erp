import prisma from "../../db/client.js";
import { toDoc, toDocs } from "../../db/present.js";
import { refId, requireUuid } from "../../db/ids.js";

const include = {
  table: { select: { id: true, number: true, seats: true, status: true } },
  customer: { select: { id: true, name: true, phone: true, email: true } },
};

class ReservationService {
  async getAll(restaurantId, filter = {}) {
    const where = { restaurantId: requireUuid(restaurantId) };
    if (filter.status) where.status = filter.status;
    const rows = await prisma.reservation.findMany({
      where,
      include,
      orderBy: { reservedAt: "desc" },
    });
    return toDocs(rows);
  }

  async getById(id, restaurantId) {
    const reservationId = requireUuid(id);
    if (!reservationId) return null;
    return toDoc(
      await prisma.reservation.findFirst({
        where: { id: reservationId, restaurantId: requireUuid(restaurantId) },
        include,
      }),
    );
  }

  async create(data) {
    const row = await prisma.reservation.create({
      data: {
        reservedAt: new Date(data.reservedAt),
        numberOfGuests: Number(data.numberOfGuests),
        durationMinutes: data.durationMinutes ? Number(data.durationMinutes) : 60,
        status: data.status || "pending",
        notes: data.notes,
        tableId: requireUuid(data.table),
        customerId: requireUuid(data.customer),
        restaurantId: requireUuid(data.restaurant || data.restaurantId),
      },
      include,
    });
    const reservation = toDoc(row);
    if (reservation.status === "confirmed" && reservation.table) {
      await this._updateTableStatus(
        refId(reservation.table),
        reservation.restaurantId,
        "reserved",
      );
    }
    return reservation;
  }

  async request(data) {
    const { name, phone, email, restaurant, ...reservationData } = data;
    const restaurantId = requireUuid(restaurant);
    if (!restaurantId) {
      throw new Error("Restaurant ID is required for reservation requests");
    }

    let customer = await prisma.customer.findFirst({
      where: { phone, restaurantId },
    });
    if (customer) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          ...(name ? { name } : {}),
          ...(email ? { email } : {}),
        },
      });
    } else {
      customer = await prisma.customer.create({
        data: { name, phone, email, restaurantId },
      });
    }

    const row = await prisma.reservation.create({
      data: {
        reservedAt: new Date(reservationData.reservedAt),
        numberOfGuests: Number(reservationData.numberOfGuests),
        durationMinutes: reservationData.durationMinutes
          ? Number(reservationData.durationMinutes)
          : 60,
        status: "pending",
        notes: reservationData.notes,
        tableId: requireUuid(reservationData.table),
        customerId: customer.id,
        restaurantId,
      },
      include,
    });
    return toDoc(row);
  }

  async update(id, restaurantId, data) {
    const oldReservation = await prisma.reservation.findFirst({
      where: { id: requireUuid(id), restaurantId: requireUuid(restaurantId) },
    });
    if (!oldReservation) return null;

    const payload = {};
    if (data.reservedAt !== undefined) payload.reservedAt = new Date(data.reservedAt);
    if (data.numberOfGuests !== undefined) payload.numberOfGuests = Number(data.numberOfGuests);
    if (data.durationMinutes !== undefined) payload.durationMinutes = Number(data.durationMinutes);
    if (data.status !== undefined) payload.status = data.status;
    if (data.notes !== undefined) payload.notes = data.notes;
    if (data.table !== undefined) payload.tableId = requireUuid(data.table);
    if (data.customer !== undefined) payload.customerId = requireUuid(data.customer);

    const row = await prisma.reservation.update({
      where: { id: oldReservation.id },
      data: payload,
      include,
    });
    const reservation = toDoc(row);

    const nextTableId = requireUuid(data.table);
    if (nextTableId && oldReservation.tableId && oldReservation.tableId !== nextTableId) {
      await this._updateTableStatus(oldReservation.tableId, restaurantId, "available");
    }

    const tableId = refId(reservation.table);
    if (tableId) {
      if (reservation.status === "confirmed") {
        await this._updateTableStatus(tableId, restaurantId, "reserved");
      } else if (
        ["cancelled", "completed"].includes(reservation.status) ||
        (reservation.status === "pending" && oldReservation.status === "confirmed")
      ) {
        await this._updateTableStatus(tableId, restaurantId, "available");
      }
    }

    return reservation;
  }

  async _updateTableStatus(tableId, restaurantId, status) {
    try {
      const id = requireUuid(tableId);
      if (!id) return;
      await prisma.table.updateMany({
        where: { id, restaurantId: requireUuid(restaurantId) },
        data: { status },
      });
    } catch (error) {
      console.error(`Failed to update table status: ${error.message}`);
    }
  }

  async delete(id, restaurantId) {
    const existing = await prisma.reservation.findFirst({
      where: { id: requireUuid(id), restaurantId: requireUuid(restaurantId) },
    });
    if (!existing) return null;
    const row = await prisma.reservation.delete({ where: { id: existing.id } });
    if (row.status === "confirmed" && row.tableId) {
      await this._updateTableStatus(row.tableId, restaurantId, "available");
    }
    return toDoc(row);
  }
}

export default new ReservationService();
