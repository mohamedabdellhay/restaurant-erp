import api from "./api";

const platformService = {
  getOverview: async () => (await api.get("/platform/overview")).data,
  getSettings: async () => (await api.get("/platform/settings")).data,
  updateSettings: async (data) => (await api.put("/platform/settings", data)).data,
  getRestaurants: async () => (await api.get("/platform/restaurants")).data,
  updateRestaurant: async (id, data) => (await api.put(`/platform/restaurants/${id}`, data)).data,
  getPlans: async () => (await api.get("/platform/plans")).data,
  createPlan: async (data) => (await api.post("/platform/plans", data)).data,
  updatePlan: async (id, data) => (await api.put(`/platform/plans/${id}`, data)).data,
  getSubscriptions: async () => (await api.get("/platform/subscriptions")).data,
  updateSubscription: async (id, status) =>
    (await api.put(`/platform/subscriptions/${id}`, { status })).data,
};

export default platformService;
