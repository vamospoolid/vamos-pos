import axios from 'axios';
import { useAppStore } from './store/appStore';

// Get or Generate a persistent Device ID for 1-Device-1-ID policy
let deviceId = localStorage.getItem('playerDeviceId');
if (!deviceId) {
    // Fallback for older Android devices that don't support crypto.randomUUID()
    deviceId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('playerDeviceId', deviceId);
}

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://pos.vamospool.id/api', 
});

// Base URL tanpa /api — untuk akses file statis
const STATIC_BASE = (import.meta.env.VITE_API_URL || 'https://pos.vamospool.id/api').replace(/\/api$/, '');

/**
 * Resolves member photo paths to a full URL.
 * DB menyimpan foto sebagai:  /uploads/avatars/xxx.jpg
 * Backend serve static dari:  /public/uploads/...
 * Nginx expose sebagai:        https://pos.vamospool.id/uploads/avatars/xxx.jpg
 */
export function getAvatarUrl(photo: string | null | undefined): string | null {
    if (!photo) return null;
    if (photo.startsWith('http')) return photo;                          // already absolute
    if (photo.startsWith('/uploads/')) return `${STATIC_BASE}${photo}`; // static file path
    // legacy: just a filename
    return `${STATIC_BASE}/uploads/avatars/${photo.split('/').pop()}`;
}

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
