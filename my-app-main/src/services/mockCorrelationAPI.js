import reportService from './reportService';
import correlationService from './correlationService';

// Mock API untuk correlation matrix
export const getCorrelationMatrix = async () => {
    try {
        // Ambil data dari report service
        const response = await reportService.getAllSelectionResults({ limit: 99999 });
        const data = response.results || [];
        
        if (data.length === 0) {
            // Return mock data jika tidak ada data
            return {
                attributes: ['IPK', 'Penghasilan', 'Tanggungan', 'Organisasi', 'UKM', 'Status'],
                matrix: [
                    [1.00, -0.23, 0.15, 0.34, 0.28, 0.67],
                    [-0.23, 1.00, 0.45, -0.12, -0.08, -0.52],
                    [0.15, 0.45, 1.00, 0.09, 0.11, -0.31],
                    [0.34, -0.12, 0.09, 1.00, 0.56, 0.41],
                    [0.28, -0.08, 0.11, 0.56, 1.00, 0.38],
                    [0.67, -0.52, -0.31, 0.41, 0.38, 1.00]
                ],
                insights: [
                    {
                        attr1: 'IPK',
                        attr2: 'Status',
                        correlation: 0.67,
                        strength: 'sedang',
                        direction: 'positif',
                        description: 'IPK dan Status memiliki korelasi positif sedang (0.670)'
                    },
                    {
                        attr1: 'Penghasilan',
                        attr2: 'Status',
                        correlation: -0.52,
                        strength: 'sedang',
                        direction: 'negatif',
                        description: 'Penghasilan dan Status memiliki korelasi negatif sedang (-0.520)'
                    }
                ]
            };
        }
        
        // Hitung korelasi dari data real
        return correlationService.calculateCorrelationMatrix(data);
        
    } catch (error) {
        console.error('Error calculating correlation matrix:', error);
        throw error;
    }
};