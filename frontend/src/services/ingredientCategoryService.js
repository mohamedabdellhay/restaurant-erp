import api from "./api";

const ingredientCategoryService = {
  getAll: async () => {
    const response = await api.get("/inventory/categories");
    return response.data;
  },

  create: async (name) => {
    const response = await api.post("/inventory/categories", { name });
    return response.data;
  },

  update: async (id, name) => {
    const response = await api.put(`/inventory/categories/${id}`, { name });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/inventory/categories/${id}`);
    return response.data;
  },
};

export default ingredientCategoryService;
