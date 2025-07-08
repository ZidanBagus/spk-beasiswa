import React, { useState, useEffect } from 'react';
import { Card, Form, Row, Col, Alert } from 'react-bootstrap';
import { Bar } from 'react-chartjs-2';
import { BarChart } from 'react-bootstrap-icons';
import axios from 'axios';

const SegmentComparisonTool = ({ isLoading }) => {
    const [segmentA, setSegmentA] = useState('DITERIMA');
    const [segmentB, setSegmentB] = useState('DITOLAK');
    const [comparisonData, setComparisonData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const segmentOptions = [
        { value: 'DITERIMA', label: 'Diterima' },
        { value: 'DITOLAK', label: 'Ditolak' },
        { value: 'HIGH_IPK', label: 'IPK Tinggi (>3.5)' },
        { value: 'LOW_IPK', label: 'IPK Rendah (≤3.5)' },
        { value: 'LOW_INCOME', label: 'Penghasilan Rendah' },
        { value: 'HIGH_INCOME', label: 'Penghasilan Tinggi' }
    ];

    useEffect(() => {
        if (segmentA && segmentB && segmentA !== segmentB) {
            fetchComparisonData();
        }
    }, [segmentA, segmentB]);

    const fetchComparisonData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`/api/applicants/compare-segments?segmentA=${segmentA}&segmentB=${segmentB}`);
            setComparisonData(response.data);
        } catch (err) {
            setError('Gagal memuat data perbandingan');
            console.error('Comparison fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const renderComparisonChart = () => {
        if (!comparisonData) return null;

        const chartData = {
            labels: ['IPK Rata-rata', 'Penghasilan Rendah (%)', 'Aktif Organisasi (%)', 'Tanggungan >3 (%)'],
            datasets: [
                {
                    label: segmentOptions.find(opt => opt.value === segmentA)?.label || segmentA,
                    data: [
                        comparisonData.comparison.ipk.segmentA,
                        comparisonData.comparison.lowIncomePercent.segmentA,
                        comparisonData.comparison.activeOrgPercent.segmentA,
                        comparisonData.comparison.highDependentsPercent.segmentA
                    ],
                    backgroundColor: 'rgba(13, 110, 253, 0.8)',
                    borderColor: 'rgba(13, 110, 253, 1)',
                    borderWidth: 2
                },
                {
                    label: segmentOptions.find(opt => opt.value === segmentB)?.label || segmentB,
                    data: [
                        comparisonData.comparison.ipk.segmentB,
                        comparisonData.comparison.lowIncomePercent.segmentB,
                        comparisonData.comparison.activeOrgPercent.segmentB,
                        comparisonData.comparison.highDependentsPercent.segmentB
                    ],
                    backgroundColor: 'rgba(220, 53, 69, 0.8)',
                    borderColor: 'rgba(220, 53, 69, 1)',
                    borderWidth: 2
                }
            ]
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.dataset.label;
                            const value = context.parsed.y;
                            const metric = context.label;
                            return `${label}: ${metric.includes('IPK') ? value.toFixed(2) : value.toFixed(1) + '%'}`;
                        }
                    }
                }
            },
            scales: {
                y: { beginAtZero: true }
            }
        };

        return <Bar data={chartData} options={options} />;
    };

    if (isLoading) {
        return (
            <Card className="h-100">
                <Card.Header>
                    <h6 className="mb-0">
                        <BarChart className="me-2" />
                        Alat Perbandingan Profil Segmen
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
            <Card.Header className="bg-primary text-white">
                <h6 className="mb-0">
                    <BarChart className="me-2" />
                    Alat Perbandingan Profil Segmen
                </h6>
                <small>Bandingkan karakteristik antara dua kelompok pendaftar</small>
            </Card.Header>
            <Card.Body>
                <Row className="mb-3">
                    <Col md={6}>
                        <Form.Label className="fw-semibold text-primary">Segmen A</Form.Label>
                        <Form.Select value={segmentA} onChange={(e) => setSegmentA(e.target.value)}>
                            {segmentOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </Form.Select>
                    </Col>
                    <Col md={6}>
                        <Form.Label className="fw-semibold text-danger">Segmen B</Form.Label>
                        <Form.Select value={segmentB} onChange={(e) => setSegmentB(e.target.value)}>
                            {segmentOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </Form.Select>
                    </Col>
                </Row>

                {error && <Alert variant="danger">{error}</Alert>}

                {loading ? (
                    <div className="text-center py-4">
                        <div className="spinner-border text-primary" />
                        <div className="mt-2">Memuat perbandingan...</div>
                    </div>
                ) : (
                    <div style={{ height: '300px' }}>
                        {renderComparisonChart()}
                    </div>
                )}

                {comparisonData && (
                    <div className="mt-3 p-2 bg-light rounded">
                        <small className="text-muted">
                            📊 <strong>Insight:</strong> Perbandingan menunjukkan {comparisonData.totalA} vs {comparisonData.totalB} pendaftar. 
                            Perbedaan terbesar terlihat pada {comparisonData.keyDifference || 'karakteristik utama'}.
                        </small>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default SegmentComparisonTool;