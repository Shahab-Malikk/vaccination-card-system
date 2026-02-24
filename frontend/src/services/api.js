import axios from "axios";

// Base API instance
const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear and redirect
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Auth APIs
export const loginUser = async (email, password) => {
  const response = await api.post("/login", { email, password });
  return response.data;
};

// Vaccine APIs
export const submitVaccineRecord = async (formData) => {
  const response = await api.post("/submit", formData);
  return response.data;
};

export const getVaccineRecord = async (id) => {
  // Public endpoint — no auth needed
  const response = await axios.get(`/api/data/${id}`);
  return response.data;
};

export default api;
