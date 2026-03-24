import axios from 'axios';
import { useAppStore } from './store/appStore';

// Get or Generate a persistent Device ID for 1-Device-1-ID policy
let deviceId = localStorage.getItem('playerDeviceId');
if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('playerDeviceId', deviceId);
}

export const api = axios.create({
    baseURL: 'http://localhost:3000/api', // Point to existing POS backend
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('playerToken');
    if (token) {
        config.headers.Authorization = token; // Controller expects player_... напрямую
    }
    // Add Device ID to identify the hardware
    config.headers['x-device-id'] = deviceId;
    return config;
});

// Response interceptor for automatic logout on session mismatch
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn("Session invalidated by 1-device-1-id policy or timeout.");
            useAppStore.getState().logout();
        }
        return Promise.reject(error);
    }
);
