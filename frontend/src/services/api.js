import axios from "axios";

// Environment-configurable API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || "https://loginapp-ezh0.onrender.com/api";

const API = axios.create({
  baseURL: API_BASE_URL,
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

export default API;