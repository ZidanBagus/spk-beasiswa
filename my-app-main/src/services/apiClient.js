// src/services/apiClient.js
import axios from 'axios';

// Get API base URL from environment
const getApiBaseUrl = () => {
  // For production build
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_BASE_URL || 'https://your-project.supabase.co/functions/v1';
  }
  // For development - check if running on localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5001/api';
  }
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
};

// Instance axios yang dikonfigurasi secara terpusat
const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Debug log for API URL
console.log('API Base URL:', getApiBaseUrl());
console.log('Environment:', import.meta.env.MODE);

// Request interceptor: Menambahkan token JWT ke setiap request secara otomatis
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Ambil token dari localStorage
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Menangani error global (misalnya 401 Unauthorized)
apiClient.interceptors.response.use(
  (response) => response, // Jika respons sukses, langsung kembalikan
  (error) => {
    // Jika error adalah 401 (Unauthorized) atau 403 (Forbidden)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn("Interceptor API: Sesi tidak valid, akses ditolak, atau token expired. Melakukan logout...");
      // Hapus data user dan token dari localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      
      // Redirect ke halaman login.
      // Menggunakan window.location.assign akan memaksa reload dan membersihkan state.
      // Tambahkan pesan agar pengguna tahu mengapa mereka di-redirect.
      if (window.location.pathname !== '/login') {
         window.location.assign('/login?sessionExpired=true&message=Sesi Anda telah berakhir atau akses ditolak. Silakan login kembali.'); 
      }
    }
    // Kembalikan error agar bisa ditangani lebih lanjut di tempat panggilan API jika perlu
    return Promise.reject(error);
  }
);

export default apiClient;