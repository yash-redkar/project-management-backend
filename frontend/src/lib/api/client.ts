import axios from "axios";

export const apiClient = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});
