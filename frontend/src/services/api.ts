import axios from "axios";
import { useAuthStore } from "../store/authStore";
import type { Role } from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

// Auth
export const login = (email: string, password: string) =>
  api.post("/auth/login", { email, password });
export const signup = (
  name: string,
  email: string,
  password: string,
  role: Role,
) => api.post("/auth/signup", { name, email, password, role });

// Tasks
export const getTasks = (params?: Record<string, string>) =>
  api.get("/tasks", { params });
export const createTask = (data: object) => api.post("/tasks", data);
export const updateTask = (id: string, data: object) =>
  api.put(`/tasks/${id}`, data);
export const updateTaskStatus = (id: string, status: string) =>
  api.patch(`/tasks/${id}/status`, { status });
export const deleteTask = (id: string) => api.delete(`/tasks/${id}`);

// Users
export const getUsers = () => api.get("/users");
export const deleteUser = (id: string) => api.delete(`/users/${id}`);

export default api;
