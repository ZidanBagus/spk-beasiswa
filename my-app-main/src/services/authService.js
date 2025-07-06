// src/services/authService.js
import apiClient from './apiClient';

const API_URL_AUTH = '/auth/';

const authService = {
  async login(username, password) {
    try {
      // For Railway backend, the endpoint is /auth/login
      const response = await apiClient.post('auth/login', {
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
  },

  async fetchCurrentUserFromServer() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No token available');
      }
      
      // For now, return the user from localStorage
      // In a real app, you might want to validate token with server
      const user = this.getCurrentUser();
      if (user) {
        return { user, token };
      }
      
      throw new Error('No user data available');
    } catch (error) {
      this.logout(); // Clear invalid data
      throw error;
    }
  }
};

export default authService;