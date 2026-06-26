import axios from "axios";

const api = axios.create({
  /*baseURL: "http://localhost:3001",*/
  baseURL: "https://tender-laughter-production-c120.up.railway.app/",
});

export default api;
