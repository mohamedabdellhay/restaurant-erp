const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const subscriptionService = {
  getPlans: async () => {
    try {
      const response = await fetch(`${API_URL}/subscription/plans`);
      if (!response.ok) throw new Error("Failed to fetch plans");
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching plans:", error);
      throw error;
    }
  },

  register: async (registrationData) => {
    try {
      const response = await fetch(`${API_URL}/subscription/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      return data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },
};
