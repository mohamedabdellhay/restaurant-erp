import api from "./api";

const uploadService = {
  // Upload single image file
  uploadImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default uploadService;
