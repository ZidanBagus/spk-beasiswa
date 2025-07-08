// Service untuk menyimpan dan mengelola history batch seleksi
class BatchHistoryService {
    constructor() {
        this.storageKey = 'spk_batch_history';
    }

    // Simpan hasil batch baru
    saveBatchResult(batchData) {
        const history = this.getBatchHistory();
        const newBatch = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString('id-ID'),
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            ...batchData
        };
        
        history.push(newBatch);
        localStorage.setItem(this.storageKey, JSON.stringify(history));
        return newBatch;
    }

    // Ambil semua history batch
    getBatchHistory() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading batch history:', error);
            return [];
        }
    }

    // Hapus history batch (jika diperlukan)
    clearHistory() {
        localStorage.removeItem(this.storageKey);
    }

    // Ambil batch terakhir
    getLatestBatch() {
        const history = this.getBatchHistory();
        return history.length > 0 ? history[history.length - 1] : null;
    }

    // Ambil statistik perbandingan
    getComparisonStats() {
        const history = this.getBatchHistory();
        if (history.length < 2) {
            return { hasComparison: false, current: 0, previous: 0, growth: 0 };
        }

        const current = history[history.length - 1];
        const previous = history[history.length - 2];
        
        const growth = previous.totalApplicants > 0 
            ? ((current.totalApplicants - previous.totalApplicants) / previous.totalApplicants * 100).toFixed(1)
            : 0;

        return {
            hasComparison: true,
            current: current.totalApplicants,
            previous: previous.totalApplicants,
            growth: parseFloat(growth),
            currentBatch: current,
            previousBatch: previous
        };
    }
}

export default new BatchHistoryService();