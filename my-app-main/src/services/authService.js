// src/services/authService.js
import apiClient from './apiClient';

const API_URL_AUTH = '/auth/';

const authService = {
  async login(username, password) {
    try {
      // For Supabase Edge Functions, the endpoint is just /auth
      const response = await apiClient.post('/auth', {
        username,
        password,
      });

      if (response.data && response.data.token && response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login gagal. Periksa username dan password Anda.' };
    }
  },

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken() {
    return localStorage.getItem('token');
  },

  isAuthenticated() {
    return !!this.getToken();
  }
};

export default authService;