// spkBeasiswa/my-app-main/src/services/batchService.js
import apiClient from './apiClient';

const API_PATH = '/batches';

const getAll = async () => {
    const response = await apiClient.get(API_PATH);
    return response.data;
};

const batchService = { getAll };
export default batchService;