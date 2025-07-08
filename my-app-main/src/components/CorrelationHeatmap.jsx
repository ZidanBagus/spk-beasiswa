import React from 'react';
import { Card } from 'react-bootstrap';

const CorrelationHeatmap = ({ correlationData, isLoading }) => {
    const criteria = ['IPK', 'Penghasilan', 'Tanggungan', 'Organisasi', 'UKM'];
    
    // Mock correlation data - replace with real data from backend
    const mockCorrelations = [
        [1.00, -0.65, 0.23, 0.45, 0.32],
        [-0.65, 1.00, -0.12, -0.34, -0.28],
        [0.23, -0.12, 1.00, 0.18, 0.15],
        [0.45, -0.34, 0.18, 1.00, 0.67],
        [0.32, -0.28, 0.15, 0.67, 1.00]
    ];

    const getColorIntensity = (value) => {
        const absValue = Math.abs(value);
        if (absValue >= 0.7) return value > 0 ? 'bg-success' : 'bg-danger';
        if (absValue >= 0.4) return value > 0 ? 'bg-success bg-opacity-75' : 'bg-danger bg-opacity-75';
        if (absValue >= 0.2) return value > 0 ? 'bg-success bg-opacity-50' : 'bg-danger bg-opacity-50';
        return 'bg-light';
    };

    if (isLoading) {
        return (
            <Card className="h-100">
                <Card.Header><h6 className="mb-0">📊 Heatmap Korelasi Kriteria</h6></Card.Header>
                <Card.Body className="d-flex justify-content-center align-items-center">
                    <div className="spinner-border text-primary" />
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="h-100">
            <Card.Header>
                <h6 className="mb-0">📊 Heatmap Korelasi Kriteria</h6>
                <small className="text-muted">Korelasi antar kriteria penerimaan beasiswa</small>
            </Card.Header>
            <Card.Body>
                <div className="table-responsive">
                    <table className="table table-sm">
                        <thead>
                            <tr>
                                <th></th>
                                {criteria.map(criterion => (
                                    <th key={criterion} className="text-center" style={{fontSize: '0.8rem'}}>
                                        {criterion}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {criteria.map((rowCriterion, i) => (
                                <tr key={rowCriterion}>
                                    <th style={{fontSize: '0.8rem'}}>{rowCriterion}</th>
                                    {criteria.map((colCriterion, j) => (
                                        <td 
                                            key={colCriterion} 
                                            className={`text-center ${getColorIntensity(mockCorrelations[i][j])}`}
                                            style={{fontSize: '0.75rem', fontWeight: 'bold'}}
                                        >
                                            {mockCorrelations[i][j].toFixed(2)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-2">
                    <small className="text-muted">
                        <span className="badge bg-success me-1">+</span>Korelasi Positif
                        <span className="badge bg-danger ms-2 me-1">-</span>Korelasi Negatif
                    </small>
                </div>
            </Card.Body>
        </Card>
    );
};

export default CorrelationHeatmap;