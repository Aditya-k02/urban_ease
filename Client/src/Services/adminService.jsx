// src/services/adminService.js
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const adminLogin = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE}/AdminLogin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Admin login error:", error);
    return { success: false, message: "Network error" };
  }
};

