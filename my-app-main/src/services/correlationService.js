// Service untuk menghitung korelasi Pearson
class CorrelationService {
    // Menghitung korelasi Pearson antara dua array
    calculatePearsonCorrelation(x, y) {
        if (x.length !== y.length || x.length === 0) {
            return 0;
        }

        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

        if (denominator === 0) return 0;
        return numerator / denominator;
    }

    // Mengkonversi data kategorikal ke numerik
    convertCategoricalToNumeric(data, field) {
        switch (field) {
            case 'penghasilanOrtu':
                return data.map(item => {
                    switch (item[field]) {
                        case 'Rendah': return 1;
                        case 'Sedang': return 2;
                        case 'Tinggi': return 3;
                        default: return 2;
                    }
                });
            case 'ikutOrganisasi':
            case 'ikutUKM':
                return data.map(item => item[field] === 'Ya' ? 1 : 0);
            case 'statusKelulusan':
                return data.map(item => (item[field] || '').trim() === 'Terima' ? 1 : 0);
            case 'ipk':
                return data.map(item => parseFloat(item[field]) || 0);
            case 'jmlTanggungan':
                return data.map(item => parseInt(item[field]) || 0);
            default:
                return data.map(() => 0);
        }
    }

    // Menghitung matriks korelasi lengkap
    calculateCorrelationMatrix(data) {
        const attributes = [
            { name: 'IPK', field: 'ipk' },
            { name: 'Penghasilan', field: 'penghasilanOrtu' },
            { name: 'Tanggungan', field: 'jmlTanggungan' },
            { name: 'Organisasi', field: 'ikutOrganisasi' },
            { name: 'UKM', field: 'ikutUKM' },
            { name: 'Status', field: 'statusKelulusan' }
        ];

        // Konversi semua atribut ke numerik
        const numericData = {};
        attributes.forEach(attr => {
            numericData[attr.name] = this.convertCategoricalToNumeric(data, attr.field);
        });

        // Hitung matriks korelasi
        const matrix = [];
        const attributeNames = attributes.map(attr => attr.name);

        attributeNames.forEach((attr1, i) => {
            const row = [];
            attributeNames.forEach((attr2, j) => {
                if (i === j) {
                    row.push(1.0); // Korelasi dengan diri sendiri = 1
                } else {
                    const correlation = this.calculatePearsonCorrelation(
                        numericData[attr1],
                        numericData[attr2]
                    );
                    row.push(correlation);
                }
            });
            matrix.push(row);
        });

        return {
            attributes: attributeNames,
            matrix: matrix,
            insights: this.generateInsights(attributeNames, matrix)
        };
    }

    // Generate insights dari matriks korelasi
    generateInsights(attributes, matrix) {
        const insights = [];
        
        for (let i = 0; i < attributes.length; i++) {
            for (let j = i + 1; j < attributes.length; j++) {
                const correlation = matrix[i][j];
                const absCorr = Math.abs(correlation);
                
                if (absCorr >= 0.5) {
                    const strength = absCorr >= 0.7 ? 'kuat' : 'sedang';
                    const direction = correlation > 0 ? 'positif' : 'negatif';
                    
                    insights.push({
                        attr1: attributes[i],
                        attr2: attributes[j],
                        correlation: correlation,
                        strength: strength,
                        direction: direction,
                        description: `${attributes[i]} dan ${attributes[j]} memiliki korelasi ${direction} ${strength} (${correlation.toFixed(3)})`
                    });
                }
            }
        }
        
        return insights.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
    }
}

export default new CorrelationService();