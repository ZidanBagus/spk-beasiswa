import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Alert } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import { Activity } from 'react-bootstrap-icons';
import axios from 'axios';

const ModelDiagnostics = ({ isLoading }) => {
    const [diagnosticsData, setDiagnosticsData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDiagnosticsData();
    }, []);

    const fetchDiagnosticsData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('/api/selection/performance-diagnostics');
            setDiagnosticsData(response.data);
        } catch (err) {
            setError('Gagal memuat diagnostik model');
            console.error('Diagnostics fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const renderConfusionMatrix = () => {
        if (!diagnosticsData?.confusionMatrix) return null;

        const { TP, TN, FP, FN } = diagnosticsData.confusionMatrix;
        const accuracy = ((TP + TN) / (TP + TN + FP + FN) * 100).toFixed(1);
        const precision = (TP / (TP + FP) * 100).toFixed(1);
        const recall = (TP / (TP + FN) * 100).toFixed(1);

        return (
            <div>
                <h6 className="text-center mb-3">Confusion Matrix</h6>
                <Table bordered className="text-center mb-3">
                    <thead>
                        <tr>
                            <th rowSpan={2} className="align-middle bg-light">Aktual</th>
                            <th colSpan={2} className="bg-light">Prediksi</th>
                        </tr>
                        <tr>
                            <th className="bg-light">Diterima</th>
                            <th className="bg-light">Ditolak</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th className="bg-light">Diterima</th>
                            <td className="bg-success bg-opacity-25 fw-bold">{TP}</td>
                            <td className="bg-danger bg-opacity-25 fw-bold">{FN}</td>
                        </tr>
                        <tr>
                            <th className="bg-light">Ditolak</th>
                            <td className="bg-warning bg-opacity-25 fw-bold">{FP}</td>
                            <td className="bg-success bg-opacity-25 fw-bold">{TN}</td>
                        </tr>
                    </tbody>
                </Table>
                
                <Row className="text-center">
                    <Col xs={4}>
                        <div className="text-success fw-bold h6">{accuracy}%</div>
                        <small className="text-muted">Akurasi</small>
                    </Col>
                    <Col xs={4}>
                        <div className="text-primary fw-bold h6">{precision}%</div>
                        <small className="text-muted">Presisi</small>
                    </Col>
                    <Col xs={4}>
                        <div className="text-warning fw-bold h6">{recall}%</div>
                        <small className="text-muted">Recall</small>
                    </Col>
                </Row>
            </div>
        );
    };

    const renderROCCurve = () => {
        if (!diagnosticsData?.rocCurve) return null;

        const rocData = {
            labels: diagnosticsData.rocCurve.map((_, index) => index),
            datasets: [
                {
                    label: 'ROC Curve',
                    data: diagnosticsData.rocCurve.map(point => ({ x: point.fpr, y: point.tpr })),
                    borderColor: 'rgb(13, 110, 253)',
                    backgroundColor: 'rgba(13, 110, 253, 0.1)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.1
                },
                {
                    label: 'Random Classifier',
                    data: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
                    borderColor: 'rgb(108, 117, 125)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0
                }
            ]
        };

        const rocOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'ROC Curve' }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: { display: true, text: 'False Positive Rate' },
                    min: 0,
                    max: 1
                },
                y: {
                    title: { display: true, text: 'True Positive Rate' },
                    min: 0,
                    max: 1
                }
            }
        };

        return (
            <div>
                <h6 className="text-center mb-3">ROC Curve (AUC: {diagnosticsData.auc?.toFixed(3) || 'N/A'})</h6>
                <div style={{ height: '200px' }}>
                    <Line data={rocData} options={rocOptions} />
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <Card className="h-100">
                <Card.Header>
                    <h6 className="mb-0">
                        <Activity className="me-2" />
                        Pusat Diagnostik Performa Model
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
            <Card.Header className="bg-success text-white">
                <h6 className="mb-0">
                    <Activity className="me-2" />
                    Pusat Diagnostik Performa Model
                </h6>
                <small>Evaluasi kualitas dan akurasi model C4.5</small>
            </Card.Header>
            <Card.Body>
                {error && <Alert variant="danger">{error}</Alert>}

                {loading ? (
                    <div className="text-center py-4">
                        <div className="spinner-border text-success" />
                        <div className="mt-2">Menganalisis performa model...</div>
                    </div>
                ) : (
                    <Row>
                        <Col md={6}>
                            {renderConfusionMatrix()}
                        </Col>
                        <Col md={6}>
                            {renderROCCurve()}
                        </Col>
                    </Row>
                )}

                {diagnosticsData && (
                    <div className="mt-3 p-2 bg-light rounded">
                        <small className="text-muted">
                            🎯 <strong>Evaluasi:</strong> Model menunjukkan akurasi {diagnosticsData.accuracy?.toFixed(1)}% 
                            dengan AUC {diagnosticsData.auc?.toFixed(3)}. 
                            {diagnosticsData.auc > 0.8 ? 'Performa sangat baik!' : diagnosticsData.auc > 0.7 ? 'Performa baik.' : 'Perlu perbaikan model.'}
                        </small>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default ModelDiagnostics;