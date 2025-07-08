import React from 'react';
import { Card } from 'react-bootstrap';
import { Diagram3 } from 'react-bootstrap-icons';

const DecisionPathAnalysis = ({ isLoading }) => {
    // Mock decision path data
    const pathData = [
        { path: 'IPK > 3.5 → Penghasilan Rendah → Organisasi Ya', count: 45, accepted: 42, rate: 93.3 },
        { path: 'IPK > 3.5 → Penghasilan Rendah → Organisasi Tidak', count: 28, accepted: 22, rate: 78.6 },
        { path: 'IPK > 3.5 → Penghasilan Sedang → UKM Ya', count: 22, accepted: 18, rate: 81.8 },
        { path: 'IPK 3.0-3.5 → Penghasilan Rendah → Organisasi Ya', count: 35, accepted: 28, rate: 80.0 },
        { path: 'IPK 3.0-3.5 → Penghasilan Rendah → UKM Ya', count: 18, accepted: 12, rate: 66.7 }
    ];

    if (isLoading) {
        return (
            <Card className="h-100">
                <Card.Header>
                    <h6 className="mb-0">
                        <Diagram3 className="me-2" />
                        Analisis Jalur Keputusan Dominan
                    </h6>
                </Card.Header>
                <Card.Body className="d-flex justify-content-center align-items-center">
                    <div className="spinner-border text-primary" />
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="h-100">
            <Card.Header className="bg-gradient-primary text-white">
                <h6 className="mb-0">
                    <Diagram3 className="me-2" />
                    Analisis Jalur Keputusan Dominan
                </h6>
                <small>Pola kombinasi atribut yang mengarah ke penerimaan</small>
            </Card.Header>
            <Card.Body>
                <div className="decision-paths">
                    {pathData.map((item, index) => (
                        <div key={index} className="path-item mb-3 p-3 border rounded">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <div className="path-flow flex-grow-1">
                                    <div className="fw-bold text-primary mb-1">Jalur #{index + 1}</div>
                                    <div className="path-text small">{item.path}</div>
                                </div>
                                <div className="text-end">
                                    <div className={`badge ${item.rate >= 80 ? 'bg-success' : item.rate >= 60 ? 'bg-warning' : 'bg-danger'} mb-1`}>
                                        {item.rate}%
                                    </div>
                                </div>
                            </div>
                            <div className="progress mb-2" style={{height: '6px'}}>
                                <div 
                                    className={`progress-bar ${item.rate >= 80 ? 'bg-success' : item.rate >= 60 ? 'bg-warning' : 'bg-danger'}`}
                                    style={{width: `${item.rate}%`}}
                                ></div>
                            </div>
                            <div className="d-flex justify-content-between small text-muted">
                                <span>{item.accepted}/{item.count} diterima</span>
                                <span>{item.count} pendaftar</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-3 p-2 bg-light rounded">
                    <small className="text-muted">
                        💡 <strong>Insight:</strong> Jalur dominan menunjukkan kombinasi IPK tinggi + Penghasilan rendah + Aktif organisasi memiliki tingkat penerimaan tertinggi (93.3%)
                    </small>
                </div>
            </Card.Body>
        </Card>
    );
};

export default DecisionPathAnalysis;