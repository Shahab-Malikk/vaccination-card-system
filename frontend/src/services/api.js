import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export const loginUser = async (email, password) => {
  const response = await api.post("/login", { email, password });
  return response.data;
};

export const submitVaccineRecord = async (formData) => {
  const response = await api.post("/submit", formData);
  return response.data;
};

export const getVaccineRecord = async (id) => {
  const backendUrl =
    import.meta.env.VITE_API_URL || "http://localhost:3001/api";
  const response = await axios.get(`${backendUrl}/data/${id}`);
  return response.data;
};

export default api;
