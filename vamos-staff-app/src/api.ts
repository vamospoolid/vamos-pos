import axios from 'axios';
import { Capacitor } from '@capacitor/core';

// Get backend URL dynamically or default to local/VPS backend
const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
        if (Capacitor.isNativePlatform?.() || (window as any).Capacitor?.isNativePlatform?.()) {
            return 'https://pos.vamospool.id/api';
        }
        const hostname = window.location.hostname;
        if (hostname.includes('vamospool.id')) {
            return 'https://pos.vamospool.id/api';
        }
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3000/api';
        }
        return `http://${hostname}:3000/api`;
    }
    return 'https://pos.vamospool.id/api';
};

export const getSocketUrl = () => {
    const base = getBaseUrl();
    return base.replace(/\/api\/?$/, '');
};

export const api = axios.create({
    baseURL: getBaseUrl(),
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 15000
});

// Helper for staff storage
export const getStoredStaff = () => {
    try {
        const item = localStorage.getItem('vamos_staff_user');
        return item ? JSON.parse(item) : null;
    } catch {
        return null;
    }
};

export const setStoredStaff = (staff: any) => {
    localStorage.setItem('vamos_staff_user', JSON.stringify(staff));
};

export const clearStoredStaff = () => {
    localStorage.removeItem('vamos_staff_user');
};
