import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { useAppStore } from './store/appStore';
import { Capacitor } from '@capacitor/core';

const getBaseURL = () => {
    const hostname = window.location.hostname;
    const isNative = Capacitor.isNativePlatform();
    
    // Auto-detect local testing environment (only if not running natively)
    if (
        !isNative && 
        (hostname === 'localhost' || 
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.'))
    ) {
        return 'http://localhost:3000/api';
    }
    
    return import.meta.env.VITE_API_URL || 'https://api.vamospool.id/api';
};

const getSocketURL = () => {
    return getBaseURL().replace(/\/api$/, '');
};

let socket: Socket | null = null;

export function getSocket() {
    if (!socket) {
        socket = io(getSocketURL());
    }
    return socket;
}

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
    baseURL: getBaseURL(), 
});

export function getAvatarUrl(photo: string | null | undefined): string | null {
    if (!photo) return null;
    if (photo.startsWith('http')) return photo;
    
    // Gunakan route API khusus untuk view avatar yang sudah terbukti bisa diakses di VPS
    const baseURL = (api.defaults.baseURL || '').replace(/\/$/, '');
    const filename = photo.split('/').pop();
    
    return `${baseURL}/player/avatar-view/${filename}`;
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
