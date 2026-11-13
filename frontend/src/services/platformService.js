import api from "./api";

const platformService = {
  getOverview: async () => (await api.get("/admin/overview")).data,
  getSettings: async () => (await api.get("/admin/settings")).data,
  updateSettings: async (data) => (await api.put("/admin/settings", data)).data,
  getRestaurants: async () => (await api.get("/admin/restaurants")).data,
  updateRestaurant: async (id, data) => (await api.put(`/admin/restaurants/${id}`, data)).data,
  getPlans: async () => (await api.get("/admin/plans")).data,
  createPlan: async (data) => (await api.post("/admin/plans", data)).data,
  updatePlan: async (id, data) => (await api.put(`/admin/plans/${id}`, data)).data,
  getSubscriptions: async () => (await api.get("/admin/subscriptions")).data,
  updateSubscription: async (id, status) =>
    (await api.put(`/admin/subscriptions/${id}`, { status })).data,
};

export default platformService;
