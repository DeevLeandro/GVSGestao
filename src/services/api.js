// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "",  
  headers: {
    "Content-Type": "application/json",

  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const extractFireDACData = (responseData) => {
  if (responseData?.FDBS?.Manager?.TableList) {
    const tables = responseData.FDBS.Manager.TableList;
    if (tables.length > 0 && tables[0].RowList?.length > 0) {
      return tables[0].RowList.map((row) => row.Original);
    }
  }
  return Array.isArray(responseData) ? responseData : [];
};

export default api;