import axios from 'axios';

// Em produção, a URL deve ser relativa ou configurada via env
// Em produção, como o Frontend é servido pelo mesmo Backend, usamos caminho relativo '/api'.
// Em desenvolvimento local, se quiser usar proxy do Vite ou rodar separado, configure VITE_API_URL.
// Configuração da URL da API
// Em produção (aaPanel), o frontend será servido pelo mesmo domínio/porta do backend,
// então usamos '/api' relativo.
// Para desenvolvimento local (se rodar backend separado), pode-se usar VITE_API_DIR.
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

const api = axios.create({
    baseURL: API_URL,
    // Timeout para evitar que requisições fiquem penduradas
    timeout: 10000,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('s3m_auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
