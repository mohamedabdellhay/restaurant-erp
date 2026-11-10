// Utility function to simulate restaurant login and apply dynamic theming
export const simulateRestaurantLogin = () => {
  const mockResponse = {
    success: true,
    message: "Logged in successfully",
    data: {
      staff: {
        _id: "6985b789089fcb3683c23070",
        name: "abdellhay",
        email: "john@restaurant.com",
        role: "admin",
        restaurant: {
          settings: {
            theme: {
              primaryColor: "#000000",
              secondaryColor: "#ffffff",
              accentColor: "#ff0000",
              mode: "light",
            },
            taxPercent: 14,
            serviceChargePercent: 12,
          },
          _id: "697c64236af7d7011759f9b4",
          name: "Gourmet Garden",
          address: "123 Foodie St, Cairo, Egypt",
          phone: "+20123456789",
          email: "contact@gourmetgarden.com",
          website: "https://gourmetgarden.com",
          currency: "EGP",
          vatNumber: "123-456-789",
          crNumber: "987654",
          createdAt: "2026-02-06T07:30:33.575Z",
          updatedAt: "2026-02-06T07:30:33.575Z",
          __v: 0,
          id: "697c64236af7d7011759f9b4",
        },
        isActive: true,
        createdAt: "2026-02-06T09:42:33.695Z",
        updatedAt: "2026-02-06T09:42:33.695Z",
        __v: 0,
      },
      accessToken:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ODViNzg5MDg5ZmNiMzY4M2MyMzA3MCIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3MDQ3NDg5MiwiZXhwIjoxNzcxMDc5NjkyfQ.rJFhAtbeeL5Zsect-JVe79gK7DmLr0WeqCD9lHfR-9w",
      refreshToken:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ODViNzg5MDg5ZmNiMzY4M2MyMzA3MCIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3MDQ3NDg5MiwiZXhwIjoxNzczMDY2ODkyfQ.tPrX9EJGO1wXoZpFJULBVJMwJCJiBz1JXtoqCixgKxc",
      restaurantSettings: {
        theme: {
          primaryColor: "#000000",
          secondaryColor: "#ffffff",
          accentColor: "#ff0000",
          mode: "light",
        },
        taxPercent: 14,
        serviceChargePercent: 12,
      },
    },
  };

  // Store in localStorage to simulate login
  const { staff, restaurantSettings } = mockResponse.data;
  const userData = {
    ...staff,
    restaurantSettings,
  };

  localStorage.setItem("user", JSON.stringify(userData));
  localStorage.setItem("token", mockResponse.data.accessToken);
  localStorage.setItem("refresh_token", mockResponse.data.refreshToken);
  localStorage.setItem(
    "restaurantSettings",
    JSON.stringify(restaurantSettings),
  );

  // Trigger storage event for theme context
  window.dispatchEvent(
    new StorageEvent("storage", {
      key: "restaurantSettings",
      newValue: JSON.stringify(restaurantSettings),
    }),
  );

  return mockResponse;
};

// Alternative restaurant themes for testing
export const testThemes = [
  {
    name: "Gourmet Garden",
    theme: {
      primaryColor: "#000000",
      secondaryColor: "#ffffff",
      accentColor: "#ff0000",
      mode: "light",
    },
  },
  {
    name: "Ocean Blue",
    theme: {
      primaryColor: "#0066cc",
      secondaryColor: "#004499",
      accentColor: "#00ccff",
      mode: "light",
    },
  },
  {
    name: "Forest Green",
    theme: {
      primaryColor: "#2d5016",
      secondaryColor: "#5a7c2e",
      accentColor: "#8bc34a",
      mode: "light",
    },
  },
  {
    name: "Sunset Orange",
    theme: {
      primaryColor: "#ff6b35",
      secondaryColor: "#f7931e",
      accentColor: "#ffab00",
      mode: "light",
    },
  },
];

export const applyTestTheme = (themeIndex) => {
  const selectedTheme = testThemes[themeIndex];
  if (!selectedTheme) return;

  const restaurantSettings = {
    theme: selectedTheme.theme,
    taxPercent: 14,
    serviceChargePercent: 12,
  };

  localStorage.setItem(
    "restaurantSettings",
    JSON.stringify(restaurantSettings),
  );

  // Trigger storage event for theme context
  window.dispatchEvent(
    new StorageEvent("storage", {
      key: "restaurantSettings",
      newValue: JSON.stringify(restaurantSettings),
    }),
  );
};
export const presetThemes = testThemes;
