import api from "./api";

const reservationService = {
  // Get all reservations
  getAll: async () => {
    try {
      const response = await api.get("/reservations");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get reservation by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/reservations/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new reservation (admin/staff)
  create: async (reservationData) => {
    try {
      const response = await api.post("/reservations", reservationData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create guest reservation request
  createGuestRequest: async (guestRequestData) => {
    try {
      const response = await api.post(
        "/reservations/request",
        guestRequestData,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update reservation
  update: async (id, reservationData) => {
    try {
      const response = await api.patch(`/reservations/${id}`, reservationData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete reservation
  delete: async (id) => {
    try {
      const response = await api.delete(`/reservations/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default reservationService;
