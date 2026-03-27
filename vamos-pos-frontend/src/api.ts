import axios from 'axios';

export const api = axios.create({
    baseURL: (window.location.protocol === 'file:' || window.location.origin.includes('localhost'))
        ? 'http://localhost:3000/api' 
        : (window.location.origin + '/api'),
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('vamos_token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
