import axios from 'axios';

// Em produção, a URL deve ser relativa ou configurada via env
// Em produção, como o Frontend é servido pelo mesmo Backend, usamos caminho relativo '/api'.
// Em desenvolvimento local, se quiser usar proxy do Vite ou rodar separado, configure VITE_API_URL.
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('s3m_auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
