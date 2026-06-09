import axios from 'axios';

const getBaseURL = () => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // If loaded locally, redirect API requests to the local backend port
    if (
        hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname === 'pos.local' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        protocol === 'file:'
    ) {
        return 'http://localhost:3000/api';
    }
    
    return import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
};

export const api = axios.create({
    baseURL: getBaseURL(), 
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('vamos_token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
export const getSocketURL = () => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    if (
        hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname === 'pos.local' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        protocol === 'file:'
    ) {
        return 'http://localhost:3000';
    }
    
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    return apiUrl.replace(/\/api$/, '');
};
