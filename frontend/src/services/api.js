import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
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

// ===== AUTH =====
export const loginUser = async (email, password) => {
  const response = await api.post("/login", { email, password });
  return response.data;
};

// ===== VACCINE RECORDS =====
export const submitVaccineRecord = async (formData) => {
  const response = await api.post("/submit", formData);
  return response.data;
};

export const getMyRecords = async () => {
  const response = await api.get("/records");
  return response.data;
};

export const updateRecord = async (uuid, formData) => {
  const response = await api.put(`/records/${uuid}`, formData);
  return response.data;
};

// ===== PUBLIC VERIFY =====
export const verifyVaccineToken = async (token) => {
  const backendUrl =
    import.meta.env.VITE_API_URL || "http://localhost:3001/api";
  const response = await axios.get(
    `${backendUrl}/verify?token=${encodeURIComponent(token)}`,
  );
  return response.data;
};

// ===== ADMIN — CENTERS =====
export const getCenters = async () => {
  const response = await api.get("/admin/centers");
  return response.data;
};

export const createCenter = async (data) => {
  const response = await api.post("/admin/centers", data);
  return response.data;
};

export const updateCenter = async (uuid, data) => {
  const response = await api.put(`/admin/centers/${uuid}`, data);
  return response.data;
};

export const deleteCenter = async (uuid) => {
  const response = await api.delete(`/admin/centers/${uuid}`);
  return response.data;
};

// ===== ADMIN — CENTER USERS =====
export const getCenterUser = async (centerUuid) => {
  const response = await api.get(`/admin/centers/${centerUuid}/user`);
  return response.data;
};

export const createCenterUser = async (centerUuid, data) => {
  const response = await api.post(`/admin/centers/${centerUuid}/user`, data);
  return response.data;
};

export const deleteCenterUser = async (centerUuid) => {
  const response = await api.delete(`/admin/centers/${centerUuid}/user`);
  return response.data;
};

// ===== ADMIN — VACCINE BATCHES =====
export const getBatches = async () => {
  const response = await api.get("/admin/batches");
  return response.data;
};

export const createBatch = async (data) => {
  const response = await api.post("/admin/batches", data);
  return response.data;
};

export const deleteBatch = async (uuid) => {
  const response = await api.delete(`/admin/batches/${uuid}`);
  return response.data;
};

// Add this to existing api.js
export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.post("/change-password", {
    currentPassword,
    newPassword,
  });
  return response.data;
};

// Search records by CNIC or Passport No
export const searchRecords = async (query) => {
  const response = await api.get(
    `/records/search?q=${encodeURIComponent(query)}`,
  );
  return response.data;
};

export default api;
