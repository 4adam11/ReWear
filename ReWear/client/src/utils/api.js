// Set VITE_API_URL in client/.env for deployments
const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default API;
