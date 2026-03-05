import axios from 'axios';

export const api = axios.create({
    baseURL: 'http://localhost:3000/api', // Point to existing POS backend
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('playerToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
