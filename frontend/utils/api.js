import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5008/api',
});

// Automatically inject JWT token into requests
API.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default API;
