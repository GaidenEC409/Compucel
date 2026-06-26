import axios from "axios";
//Aqui
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
});

export default api;
