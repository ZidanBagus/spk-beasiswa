// spkBeasiswa/my-app-main/src/services/attributeService.js

import apiClient from './apiClient';

// Alamat API yang benar adalah '/attributes'
const API_PATH = '/attributes';

const getAllAttributes = async () => {
  // Memanggil GET /api/attributes
  const response = await apiClient.get(API_PATH);
  return response.data;
};

const updateAttributes = async (attributes) => {
  // Memanggil PUT /api/attributes
  const response = await apiClient.put(API_PATH, attributes);
  return response.data;
};

const attributeService = {
  getAllAttributes,
  updateAttributes,
};

export default attributeService;