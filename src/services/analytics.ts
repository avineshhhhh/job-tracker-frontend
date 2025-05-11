import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    // FIXED: Add 'Bearer ' prefix to token
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const analytics = {
  getStatusSummary: async () => {
    const response = await api.get("/analytics/status-summary");
    return response.data;
  },

  getApplicationTimeline: async (
    timePeriod: "weekly" | "monthly" = "monthly"
  ) => {
    const response = await api.get(
      `/analytics/application-timeline?time_period=${timePeriod}`
    );
    return response.data;
  },

  getCompanyDistribution: async (limit: number = 5) => {
    const response = await api.get(
      `/analytics/company-distribution?limit=${limit}`
    );
    return response.data;
  },

  getOverallStats: async () => {
    const response = await api.get("/analytics/overall-stats");
    return response.data;
  },

  getStatusChangeTime: async () => {
    const response = await api.get("/analytics/status-change-time");
    return response.data;
  },
};
