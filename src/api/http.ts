import axios from "axios";
import { storage } from "../utils/storage";

const http = axios.create({
    // Sử dụng biến môi trường của Vite, nếu không có thì mặc định về localhost
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5201/api",
});

http.interceptors.request.use(config => {
    const token = storage.getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});


http.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 403||error.response?.status === 401 ) {

            // redirect sang block
            window.location.href = "/blocked";
        }

        return Promise.reject(error);
    }
);

export default http;
