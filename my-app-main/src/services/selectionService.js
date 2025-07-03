// spkBeasiswa/my-app-main/src/services/selectionService.js

import apiClient from './apiClient';

const API_PATH = '/selection';

/**
 * Fungsi untuk melatih model.
 * Mengirim data latih dan atribut terpilih ke backend.
 */
const trainModel = async (trainingDataIds, selectedAttributeNames) => {
    try {
        const response = await apiClient.post(`${API_PATH}/train`, { trainingDataIds, selectedAttributeNames });
        return response.data;
    } catch (error) {
        console.error("Error training model:", error.response?.data || error.message);
        throw error.response?.data || { message: 'Gagal melatih model.' };
    }
};

/**
 * Fungsi untuk menguji model.
 * Mengirim data uji ke backend untuk dievaluasi.
 */
const testModel = async (testingDataIds) => {
    try {
        const response = await apiClient.post(`${API_PATH}/test`, { testingDataIds });
        return response.data;
    } catch (error) {
        console.error("Error testing model:", error.response?.data || error.message);
        throw error.response?.data || { message: 'Gagal menguji model.' };
    }
};

/**
 * Fungsi untuk mendapatkan visualisasi pohon keputusan.
 */
const getTreeVisualization = async () => {
    try {
        const response = await apiClient.get(`${API_PATH}/visualize`);
        return response.data;
    } catch (error) {
        console.error("Error getting tree visualization:", error.response?.data || error.message);
        throw error.response?.data || { message: 'Gagal memuat visualisasi pohon.' };
    }
};

/**
 * Fungsi untuk melakukan prediksi pada satu data tunggal.
 */
const predictSingle = async (applicantData) => {
    try {
        const response = await apiClient.post(`${API_PATH}/predict-single`, applicantData);
        return response.data;
    } catch (error) {
        console.error("Error predicting single instance:", error.response?.data || error.message);
        throw error.response?.data || { message: 'Gagal melakukan prediksi.' };
    }
};

/**
 * Fungsi untuk mengecek status model apakah sudah dilatih atau belum.
 */
const checkModelStatus = async () => {
    try {
        const response = await apiClient.get(`${API_PATH}/model-status`);
        return response.data;
    } catch (error) {
        console.error("Error checking model status:", error.response?.data || error.message);
        throw error.response?.data || { message: 'Gagal mengecek status model.' };
    }
};

/**
 * Fungsi untuk menguji model pada seluruh data.
 */
const testModelOnAllData = async () => {
    try {
        const response = await apiClient.post(`${API_PATH}/test-all`);
        return response.data;
    } catch (error) {
        console.error("Error testing model on all data:", error.response?.data || error.message);
        throw error.response?.data || { message: 'Gagal menguji seluruh data.' };
    }
};

/**
 * Fungsi untuk mendapatkan statistik model.
 */
const getModelStatistics = async () => {
    try {
        const response = await apiClient.get(`${API_PATH}/statistics`);
        return response.data;
    } catch (error) {
        console.error("Error getting model statistics:", error.response?.data || error.message);
        throw error.response?.data || { message: 'Gagal memuat statistik model.' };
    }
};

/**
 * Fungsi untuk reset model.
 */
const resetModel = async () => {
    try {
        const response = await apiClient.post(`${API_PATH}/reset`);
        return response.data;
    } catch (error) {
        console.error("Error resetting model:", error.response?.data || error.message);
        throw error.response?.data || { message: 'Gagal mereset model.' };
    }
};

// Objek yang akan diekspor, berisi semua fungsi di atas
const selectionService = {
  trainModel,
  testModel,
  getTreeVisualization,
  predictSingle,
  checkModelStatus,
  testModelOnAllData,
  getModelStatistics,
  resetModel
};

export default selectionService;